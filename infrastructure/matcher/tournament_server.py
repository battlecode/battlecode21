#!/usr/bin/env python3

import util, bracketlib
from config import *

import logging, threading, queue, time, requests


class TournamentManager:
    """
    A utility that manages a tournament queue using a tournament bracket.
    Accepts and processes match results, and produces lists of ongoing
    matches to monitor and lists of matches ready to be queued.
    """

    class MatchInfo:
        def __init__(self, internal_id, player1_pk, player2_pk, player1_name, player2_name):
            self.internal_id = internal_id # The internally known id of the match
            self.external_id = None        # The match id assigned by the backend database
            self.player1_pk = player1_pk
            self.player2_pk = player2_pk
            self.player1_name = player1_name
            self.player2_name = player2_name

        def __str__(self):
            return '[internal {0:>3}] [external {1:>5}] | {2} ({3}) -vs- {4} ({5})'.format(
                self.internal_id, self.external_id if self.external_id != None else "?",
                self.player1_pk, self.player1_name,
                self.player2_pk, self.player2_name)

    def __init__(self, bracket, team_pk, team_names):
        """
        Initialises this tournament bracket. Requires the following
        parameters:
         - bracket:    a Tournament instance containing the bracket to be
                       used for running this tournament
         - team_pk:    a list of primary keys for each team,
                       which may be useful in tournament starter procedures
         - team_names: a list of team names, used in human-readable log
                       outputs
        """
        if not isinstance(bracket, bracketlib.Tournament):
            raise TypeError("bracket must be a Tournament")

        self.bracket = bracket
        self.team_pk = team_pk
        self.team_names = team_names
        self.remaining_games = len(self.bracket.matches)
        self.lock = threading.Lock()

        self.match_is_prerequisite_of = []
        for idx, match in enumerate(self.bracket.matches):
            self.match_is_prerequisite_of += [[]]
            if isinstance(match.player1, bracketlib.MatchResultPlayer):
                self.match_is_prerequisite_of[match.player1.match_idx] += [(idx, 1)]
            if isinstance(match.player2, bracketlib.MatchResultPlayer):
                self.match_is_prerequisite_of[match.player2.match_idx] += [(idx, 2)]

    def start(self):
        """Returns a list of matches that are initially ready to be queued"""
        ready = []
        for idx, match in enumerate(self.bracket.matches):
            if isinstance(match.player1, bracketlib.Team) and isinstance(match.player2, bracketlib.Team):
                ready.append(TournamentManager.MatchInfo(idx,
                    self.team_pk[match.player1.team_id],
                    self.team_pk[match.player2.team_id],
                    self.team_names[match.player1.team_id],
                    self.team_names[match.player2.team_id]))
        return ready

    def report_winner(self, match, winner):
        """
        Reports the outcome of a game, updating the tournament manager's internal state.
        Parameters:
         - match must be a MatchInfo instance
         - winner must be either 1 or 2
        Returns a list of matches that are ready to be queued as a result of this outcome.
        """
        self.bracket.matches[match.internal_id].report_winner(winner)
        self.remaining_games -= 1

        # Check if new matches are now ready to be played
        ready = []
        for next_match, playernum in self.match_is_prerequisite_of[match.internal_id]:
            # Update match player
            if playernum == 1:
                self.bracket.matches[next_match].player1 = bracketlib.Team(self.bracket.matches[next_match].player1.get_team_id(self.bracket.matches))
            else:
                self.bracket.matches[next_match].player2 = bracketlib.Team(self.bracket.matches[next_match].player2.get_team_id(self.bracket.matches))
            # Check if match is ready
            if isinstance(self.bracket.matches[next_match].player1, bracketlib.Team) and isinstance(self.bracket.matches[next_match].player2, bracketlib.Team):
                ready.append(TournamentManager.MatchInfo(next_match,
                    self.team_pk[self.bracket.matches[next_match].player1.team_id],
                    self.team_pk[self.bracket.matches[next_match].player2.team_id],
                    self.team_names[self.bracket.matches[next_match].player1.team_id],
                    self.team_names[self.bracket.matches[next_match].player2.team_id]))
        return ready

    def is_complete(self):
        return self.remaining_games == 0


def publish_match(player1, player2):
    try:
        auth_token = util.get_api_auth_token()
        response = requests.post(url=API_SCRIMMAGE_ENQUEUE, data={
            'type': 'tournament',
            'player1': player1,
            'player2': player2
        }, headers={
            'Authorization': 'Bearer {}'.format(auth_token)
        })
        response.raise_for_status()
        return response.text
    except:
        logging.error('Could not send game to API endpoint')

def get_match_winner(match):
    """Checks the status of a match, returning either 1, 2 or None"""
    try:
        auth_token = util.get_api_auth_token()
        response = requests.get(url=API_MATCH_STATUS, data={
            'id': match.external_id
        }, headers={
            'Authorization': 'Bearer {}'.format(auth_token)
        })
        response.raise_for_status()
        if response.text == 'redwon':
            return 1
        elif response.text == 'bluewon':
            return 2
        elif response.text == 'queued':
            return None
        else:
            raise RuntimeError('Unexpected match status: {}'.format(response.text))
    except Exception as e:
        logging.error('Could not get match winner', exc_info=e)
        return None


def run_tournament(num_players, team_pk, team_names):
    """Generates the tournament bracket and publishes it to the queue"""
    tournament = bracketlib.SingleEliminationTournament(num_players)
    tournament.generate_bracket()
    manager = TournamentManager(tournament, team_pk, team_names)

    ready = queue.Queue()   # A list of matches ready to be queued
    monitor = queue.Queue() # A list of matches to monitor results on

    # Enqueue initial matches
    for match in manager.start():
        ready.put(match)

    def enqueue_worker():
        """A worker to enqueue matches"""
        while not manager.is_complete():
            try:
                match = ready.get(timeout=TOURNAMENT_WORKER_TIMEOUT)
            except queue.Empty:
                logging.info('Found no match ready to queue')
                continue
            try:
                logging.info('Sending match: {}'.format(match))
                match.external_id = publish_match(match.player1_pk, match.player2_pk)
                monitor.put(match)
            except:
                logging.error('Error enqueueing match: {}'.format(match))

    def dequeue_worker():
        """A worker to check for completed matches"""
        while not manager.is_complete():
            try:
                match = monitor.get(timeout=TOURNAMENT_WORKER_TIMEOUT)
            except queue.Empty:
                logging.info('Found no match to monitor')
                continue
            try:
                winner = get_match_winner(match)
                if winner == None:
                    logging.info('Winner not yet declared for match: {}'.format(match))
                    time.sleep(TOURNAMENT_WORKER_TIMEOUT) # Prevent spam
                    monitor.put(match)
                else:
                    logging.info('Player {} wins match {}'.format(winner, match))
                    with manager.lock:
                        matches = manager.report_winner(match, winner)
                    for match in matches:
                        ready.put(match)
            except:
                logging.error('Error monitoring match: {}'.format(match))

    threads = []
    for i in range(NUM_WORKER_THREADS // 2):
        threads.append(threading.Thread(target=enqueue_worker))
    for i in range(NUM_WORKER_THREADS // 2):
        threads.append(threading.Thread(target=dequeue_worker))
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()


if __name__ == '__main__':
    # TODO: receive tournament specifications, via sys.args or something
    num_players = 8
    team_pk = ['Key {}'.format(i+1) for i in range(num_players)]
    team_names = ['Team {}'.format(i+1) for i in range(num_players)]

    logging.info('Beginning tournament')
    run_tournament(num_players, team_pk, team_names)
    logging.info('Tournament finished')
