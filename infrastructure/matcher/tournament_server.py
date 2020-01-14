#!/usr/bin/env python3

import util, bracketlib
from config import *

import sys, logging, threading, queue, time, requests, json


class TournamentManager:
    """
    A utility that manages a tournament queue using a tournament bracket.
    Accepts and processes match results, and produces lists of ongoing
    matches to monitor and lists of matches ready to be queued.
    """

    class MatchInfo:
        def __init__(self, internal_id, player1_pk, player2_pk, player1_name, player2_name, round_name):
            self.internal_id = internal_id # The internally known id of the match
            self.external_ids = None       # The match id assigned by the backend database
            self.player1_pk = player1_pk
            self.player2_pk = player2_pk
            self.player1_name = player1_name
            self.player2_name = player2_name
            self.round_name = round_name

        def __str__(self):
            return '{0} | [internal {1:>3}] | {2} ({3}) -vs- {4} ({5})'.format(
                self.round_name,
                self.internal_id,
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
                    self.team_names[match.player2.team_id],
                    match.round_str))
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
                    self.team_names[self.bracket.matches[next_match].player2.team_id],
                    self.bracket.matches[next_match].round_str))
        return ready

    def is_complete(self):
        return self.remaining_games == 0


def get_match_winner(match, game_idx):
    """Checks the status of a match, returning either 1, 2 or None"""
    try:
        auth_token = util.get_api_auth_token()
        response = requests.get(url=api_match_status(match.external_ids[game_idx]), headers={
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


def run_tournament(num_players, tournament_id, team_pk, maps, team_names):
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
            for index, one_map in enumerate(maps[match.round_name]):
                while True:
                    try:
                        logging.info('Sending match: map={} | {}'.format(one_map, match))
                        match.external_id = util.enqueue({
                            'type': 'tour_scrimmage',
                            'tournament_id': tournament_id,
                            'player1': match.player1_pk if index != 1 else match.player2_pk,
                            'player2': match.player2_pk if index != 1 else match.player1_pk,
                            'map_ids': one_map
                        })
                        assert (match.external_id != None)
                        monitor.put(match)
                    except:
                        logging.error('Error enqueueing match: map={} | {}'.format(one_map, match))
                        ready.put(match)
                        time.sleep(TOURNAMENT_WORKER_TIMEOUT)
                    else:
                        break

    def dequeue_worker():
        """A worker to check for completed matches"""
        while not manager.is_complete():
            try:
                match = monitor.get(timeout=TOURNAMENT_WORKER_TIMEOUT)
            except queue.Empty:
                logging.info('Found no match to monitor')
                continue

            wins = [None, 0, 0]
            complete = True
            for index, one_map in enumerate(maps[match.round_name]):
                complete = False
                try:
                    winner = get_match_winner(match, index)
                    if winner == None:
                        logging.info('Winner not yet declared for match: {}'.format(match))
                        time.sleep(TOURNAMENT_WORKER_TIMEOUT) # Prevent spam
                        monitor.put(match)
                        break
                    else:
                        if index != 1:
                            wins[winner] += 1
                        else
                            wins[3-winner] += 1
                        complete = True
                        continue
                except:
                    logging.error('Error monitoring match: {}'.format(match))
                    monitor.put(match)
                    time.sleep(TOURNAMENT_WORKER_TIMEOUT)
                    break
            if complete:
                winner = 1 if wins[1] > wins[2] else 2
                logging.info('{} wins match {}. Result is {}:{}'.format(
                    match.player1_name if winner == 1 else match.player2_name,
                    match,
                    wins[1], wins[2]))
                with manager.lock:
                    matches = manager.report_winner(match, winner)
                for match in matches:
                    ready.put(match)

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
    # Command-line usage: ./tournament_server.py argv, where:
    # argv[1] = tournament_id
    # argv[2] = file containing pk
    # argv[3] = file containing names
    # argv[4] = file containing map config
    # Team data should be ordered from first to last seed, one per line
    # Map data should be a JSON map from round name to a string containing a comma-separated map list

    tournament_id = sys.argv[1]
    team_pk = []
    team_names = []
    maps = []
    with open(sys.argv[2], 'r') as f:
        team_pk = [line[:-1] for line in f.readlines()] # Trim trailing '\n'
    with open(sys.argv[3], 'r') as f:
        team_names = [line[:-1] for line in f.readlines()] # Trim trailing '\n'
    with open(sys.argv[4], 'r') as f:
        maps = json.loads(f.read())

    assert (len(team_pk) == len(team_names))
    num_players = len(team_pk)

    logging.info('Beginning tournament')
    run_tournament(num_players, tournament_id, team_pk, maps, team_names)
    logging.info('Tournament finished')
