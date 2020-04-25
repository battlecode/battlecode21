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

    def __init__(self, bracket, team_pk, team_names, maps):
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
        self.external_ids = [[] for match in self.bracket.matches]
        self.replays = [None for match in self.bracket.matches]
        self.lock = threading.Lock()

        # Delete matches that have been nullified in the map spec
        self.bracket.matches = list(filter(lambda x: maps[x.round_str] != None, self.bracket.matches))
        self.remaining_games = len(self.bracket.matches)

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


def get_match_result(match_id):
    """
    Checks the status of a match, returning a tuple winner, replay
    winner is either 1, 2 or None
    replay is set to the replay string, only if winner is defined
    """
    try:
        auth_token = util.get_api_auth_token()
        response = requests.get(url=api_match_status(match_id), headers={
            'Authorization': 'Bearer {}'.format(auth_token)
        })
        response.raise_for_status()
        result = response.json()
        status, replay = result['status'], result['replay']
        if status == 'redwon':
            return 1, replay
        elif status == 'bluewon':
            return 2, replay
        elif status == 'queued':
            return None, None
        else:
            raise RuntimeError('Unexpected match status: {}'.format(response.text))
    except Exception as e:
        logging.error('Could not get match winner (game id={})'.format(match_id), exc_info=e)
        return None, None



class MatchInfo:
        def __init__(self, internal_id, player1_pk, player2_pk, player1_name, player2_name, round_name):
            self.internal_id = internal_id # The internally known id of the match
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

def run_tournament(num_players, tournament_id, team_pk, team_names, dump_file):
    """Generates the tournament bracket and publishes it to the queue"""
    # tournament = bracketlib.DoubleEliminationTournament(num_players)
    # tournament.generate_bracket()
    # manager = TournamentManager(tournament, team_pk, team_names, maps)

    ready = queue.Queue()   # A list of matches ready to be queued
    monitor = queue.Queue() # A list of matches to monitor results on

    num_matches = len(team_pk) * (len(team_pk) - 1)
    external_ids = [None] * num_matches
    replays = [None] * num_matches
    state_lock = threading.Lock()

    # Enqueue initial matches
    id = 0
    for pk1, name1 in zip(team_pk, team_names):
        for pk2, name2 in zip(team_pk, team_names):
            if not pk2 == pk1:
                ready.put(MatchInfo(id, pk1, pk2, name1, name2, 'robin'))
                id += 1

    def enqueue_worker():
        """A worker to enqueue matches"""
        while not ready.empty():
            # try to get next match to queue, error if there is none
            try:
                match = ready.get(timeout=TOURNAMENT_WORKER_TIMEOUT)
            except queue.Empty:
                logging.info('Found no match ready to queue')
                continue


            with state_lock:
                external_ids[match.internal_id] = [None]
                replays[match.internal_id] = [None]
            while True:
                try:
                    logging.info('Sending match: {}'.format(match))
                    external_ids[match.internal_id] = util.enqueue({
                        'type': 'tour_scrimmage',
                        'tournament_id': tournament_id,
                        'player1': match.player1_pk, # player 1 is always white
                        'player2': match.player2_pk
                    })
                    assert (external_ids[match.internal_id] != None)
                except:
                    logging.error('Error enqueueing match from server: {}'.format(match))
                    time.sleep(TOURNAMENT_WORKER_TIMEOUT)
                else:
                    break
            # tell other thread to wait for results on this game
            monitor.put(match)

    def dequeue_worker():
        """A worker to check for completed matches"""
        while not (monitor.empty() and ready.empty()):
            try:
                match = monitor.get(timeout=TOURNAMENT_WORKER_TIMEOUT)
            except queue.Empty:
                logging.info('Found no match to monitor')
                continue

            wins = [None,0,0]
            replay = None
            
            complete = False
            try:
                # Get match result
                winner, replaynum = get_match_result(external_ids[match.internal_id])
                if winner == None:
                    # Match is unfinished, wait
                    logging.info('Winner not yet declared for match: {} | {}'.format(external_ids[match.internal_id], match))
                    time.sleep(TOURNAMENT_WORKER_TIMEOUT) # Prevent spam
                    monitor.put(match) # Add match back to monitor queue
                else:
                    #Match is finished
                    wins[winner] += 1                                                 #TODO: check polarity
                    replay = (match.player1_name, match.player2_name, winner, replaynum) #TODO: check polarity
                    complete = True
            except Exception as e:
                logging.error(e)
                logging.error('Error monitoring match: {}'.format(match))
                monitor.put(match)
                time.sleep(TOURNAMENT_WORKER_TIMEOUT)
                break

            # If a complete matchup was monitored
            if complete:
                winner = 1 if wins[1] > wins[2] else 2
                logging.info('{} wins match {}. Result is {}:{}'.format(
                    match.player1_name if winner == 1 else match.player2_name,
                    match,
                    wins[1], wins[2]))
                with state_lock:
                    replays[match.internal_id] = replay
                    with open(dump_file, 'w') as f:
                        print(replays[0])
                        f.write(json.dumps(replays))
        logging.info('exit monitor thread')

    threads = []
    for i in range(NUM_WORKER_THREADS // 2):
        threads.append(threading.Thread(target=enqueue_worker))
    for i in range(NUM_WORKER_THREADS // 2):
        threads.append(threading.Thread(target=dequeue_worker))
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    
    with open(dump_file, 'w') as f:
        print(replays[0])
        f.write(json.dumps(replays))
    logging.info(json.dumps(replays))

    return replays


if __name__ == '__main__':
    # Command-line usage: ./tournament_server.py argv, where:
    # argv[1] = tournament_id
    # argv[2] = file containing pk and names
    # Team data should be ordered from first to last seed, one per line

    tournament_id = sys.argv[1]
    team_pk = []
    team_names = []

    teams = {}

    # open groupN.txt
    with open(sys.argv[2], 'r') as f:
        for line in f.readlines():
            pk = line.split(',')[0]
            name = line.split(',')[1]
            team_pk.append(pk)
            team_names.append(name)

            teams[name[:-1]] = {'pk':pk, 'wins':0, 'games':0}

    print(team_pk)
    print(team_names)

    assert (len(team_pk) == len(team_names))
    num_players = len(team_pk)

    logging.info('Beginning tournament')
    replays = run_tournament(num_players, tournament_id, team_pk, team_names, '{}-results.json'.format(sys.argv[2].split('.')[0]))
    logging.info('Tournament finished')

    for replay in replays:
        name1, name2, winner, replaynum = replay 
        teams[name1]['games'] += 1
        teams[name2]['games'] += 1

        if winner == 1:
            winnerteam = name1
        else:
            winnerteam = name2
        
        teams[winnerteam]['wins'] += 1

    with open('{}-results.txt'.format(sys.argv[2].split('.')[0]), 'w') as f:
        for name in team_names:
            team = teams[name]
            f.write('{},{},{},{}\n'.format( team['pk'], name, team['wins'], team['games'] ) )

    while True: # Block to keep the docker instance from exiting
        pass
