"""
A double-elimination bracket generator
Reverse-engineering Challonge is, like, work
"""

from config import *

import sys
import logging
import heapq
import json

class Entity:
    """A class for a generic team-like entity"""

    def __init__(self):
        raise NotImplementedError

class Team(Entity):
    """A class that represents a specific team"""

    def __init__(self, team_id):
        self.team_id = team_id

    def __str__(self):
        return 'Team #{}'.format(self.team_id + 1)

class MatchResultPlayer(Entity):
    """A class that represents the winner or loser of a particular match"""

    def __init__(self, match_idx):
        self.match_idx = match_idx

    def __str__(self):
        return 'Player in [{}]'.format(self.match_idx + 1)

    def get_team_id(self, matches):
        raise NotImplementedError

class Winner(MatchResultPlayer):
    """A class that represents the winner of a particular match"""

    def __str__(self):
        return 'Winner of [{}]'.format(self.match_idx + 1)

    def get_team_id(self, matches):
        """Retrieve the actual team represented by this object"""
        return matches[self.match_idx].winner.team_id

class Loser(MatchResultPlayer):
    """A class that represents the loser of a particular match"""

    def __str__(self):
        return 'Loser of [{}]'.format(self.match_idx + 1)

    def get_team_id(self, matches):
        """Retrieve the actual team represented by this object"""
        return matches[self.match_idx].loser.team_id

class Match:
    """A class that holds information about a match"""

    def __init__(self, player1, player2, round_id, round_str):
        self.player1 = player1
        self.player2 = player2
        self.winner = None
        self.loser = None
        self.round_id = round_id
        self.round_str = round_str

    def __str__(self):
        return '[{}]  {} -vs- {}'.format(
            self.round_str, self.player1, self.player2)

    def report_winner(self, winner):
        """
        Reports the winner of this match. The parameter must be either of
        1 or 2.
        """
        if winner == 1:
            self.winner, self.loser = self.player1, self.player2
        elif winner == 2:
            self.winner, self.loser = self.player2, self.player1
        else:
            raise ValueError("winner is not 1 or 2")


class Tournament:
    """
    A generic tournament bracket generator.
    Rounds number of players up to a power of 2 for easier use in a
    specific algorithm, and then prunes the generated bracket to remove
    auxiliary players.
    """

    def __init__(self, num_players):
        """Initialise with number of players and round up to power of 2"""
        self.num_players = num_players
        self.bracket_size = num_players
        while self.bracket_size != (self.bracket_size & (-self.bracket_size)):
            self.bracket_size += (self.bracket_size & (-self.bracket_size))

    def generate_bracket(self):
        """Entrypoint for generating a new bracket"""
        self.matches = []
        self.generate_complete_bracket()
        self.prune_extra_players()
        self.reorder_matches()
        return self.matches

    def print(self):
        for idx, match in enumerate(self.matches):
            print ('[{0:>4}]: {1}'.format(idx + 1, match))

    def generate_complete_bracket(self):
        raise NotImplementedError

    def prune_extra_players(self):
        """
        Delete the auxiliary players that were introduced during rounding.
        Also delete unnecessary matches and resolve byes.
        """
        new_matches = []    # Output list of matches
        match_entities = [] # The entity that could result from a match; can be:
                            #  - a MatchResultPlayer, if both players exist
                            #  - a Team, if only one of the players exist
                            #  - None, if neither player exists
        cur_match_idx = 0   # The current match index

        def get_entity(player):
            """
            Resolves MatchResultPlayers where possible. In particular, byes
            are produced when players are pruned, causing some
            MatchResultPlayers to be redundant.
            """
            if isinstance(player, Team):
                if player.team_id < self.num_players:
                    return player # The player exists
                else:
                    return None # The player is an auxiliary player
            else:
                # Check if this player was arrived by a match or a bye
                is_bye = isinstance(match_entities[player.match_idx], Team) or \
                         isinstance(match_entities[player.match_idx], Winner) or \
                         isinstance(match_entities[player.match_idx], Loser)
                if is_bye and type(player) == Winner:
                    # Bye, winner is obvious
                    return match_entities[player.match_idx]
                elif is_bye and type(player) == Loser:
                    # Bye, there is no loser
                    return None
                elif isinstance(match_entities[player.match_idx], MatchResultPlayer):
                    # Game is not a bye
                    return type(player)(match_entities[player.match_idx].match_idx)
                else:
                    # Game doesn't exist because no players
                    return None

        # For each match in order, transform it using the match entities
        for match in self.matches:
            player1_entity = get_entity(match.player1)
            player2_entity = get_entity(match.player2)

            # Challonge generally prefers Losers to come before Winners,
            # except in finals
            if isinstance(player1_entity, Winner) and \
                isinstance(player2_entity, Loser) and \
                match != self.matches[-1]:
                player1_entity, player2_entity = player2_entity, player1_entity

            # Resolve this match according to the possible cases
            if player1_entity != None and player2_entity != None:
                # This match is played
                new_matches += [Match(player1_entity, player2_entity, match.round_id, match.round_str)]
                match_entities += [MatchResultPlayer(cur_match_idx)]
                cur_match_idx += 1
            elif player1_entity != None and player2_entity == None:
                # This match is a bye for player 1
                match_entities += [player1_entity]
            elif player1_entity == None and player2_entity != None:
                # This match is a bye for player 2
                match_entities += [player2_entity]
            else:
                # This match does not exist
                match_entities += [None]
        self.matches = new_matches

    def reorder_matches(self):
        """
        Reorder matches to increase the amount of time between each
        appearance of a player. Maintain that rounds are run consecutively,
        but within each round, maximise the amount of downtime for each
        player so that appearances are roughly evenly distributed. Also,
        importantly, this is done in a way consistent with what Challonge
        produces.
        """
        queue = []                         # Priority queue of matches that are ready to be played
        match_is_prerequisite_of = []      # Matches that rely on this match to be played
        match_prerequisites_satisfied = [] # How many players in this match are decided
        push_idx = 0                       # Time counter to force priority queue to be stable
        for idx, match in enumerate(self.matches):
            match_is_prerequisite_of += [[]]
            match_prerequisites_satisfied += [0]
            # Check if player 1 is a Team or a player to be determined
            if isinstance(match.player1, MatchResultPlayer):
                match_is_prerequisite_of[match.player1.match_idx] += [(idx, 1)]
            else:
                match_prerequisites_satisfied[idx] += 1
            # Check if player 2 is a Team or a player to be determined
            if isinstance(match.player2, MatchResultPlayer):
                match_is_prerequisite_of[match.player2.match_idx] += [(idx, 2)]
            else:
                match_prerequisites_satisfied[idx] += 1
            # If this match is ready to be played, add it to the game queue
            if match_prerequisites_satisfied[idx] == 2:
                heapq.heappush(queue, (match.round_id, push_idx, idx))
                push_idx += 1
        # Repeatedly add queued matches to the reordered list of matches
        new_matches = []
        new_idx = 0
        while queue:
            match = heapq.heappop(queue)[2]
            new_matches += [self.matches[match]]
            # Check if this match enables new matches to be queued
            for next_match, playernum in match_is_prerequisite_of[match]:
                if playernum == 1:
                    self.matches[next_match].player1.match_idx = new_idx
                else:
                    self.matches[next_match].player2.match_idx = new_idx
                match_prerequisites_satisfied[next_match] += 1
                if match_prerequisites_satisfied[next_match] == 2:
                    heapq.heappush(queue, (self.matches[next_match].round_id, push_idx, next_match))
                    push_idx += 1
            new_idx += 1
        self.matches = new_matches

class SingleEliminationTournament(Tournament):
    """A single elimination tournament generator"""

    def generate_complete_bracket(self):
        """
        Generates the complete bracket, consistent with a Challonge
        bracket. Assumes that number of players is a power of 2.
        """
        self.generate_recursive_bracket([0])
        self.postprocess()

    def generate_recursive_bracket(self, player_ids):
        """
        Recursively build the bracket, producing matches involving teams
        rather than MatchResultPlayers, under the assumption that the
        better seed always wins. Relies on observation that in any round,
        the sum of the team IDs is constant. Starts from the finals and
        works backwards.
        """
        cur_players = len(player_ids)
        if cur_players == self.bracket_size:
            return # No more players to be added
        new_players = []
        new_matches = []
        for player in player_ids:
            opponent = cur_players * 2 - player - 1
            new_matches += [Match(Team(player), Team(opponent), None, None)]
            new_players += [player, opponent]
        # Recursive call to get the previous round
        self.generate_recursive_bracket(new_players)
        # Update the actual round number for this round
        my_round = (self.matches[-1].round_id + 1) if self.matches else 1
        for match in new_matches:
            match.round_id = my_round
            match.round_str = 'Round {}'.format(my_round)
        self.matches += new_matches

    def postprocess(self):
        """
        Postprocesses the recursively built bracket. In particular,
        replaces Teams with MatchResultPlayers as appropriate in the
        bracket.
        """
        last_match = [None] * (self.bracket_size) # Last match that this player was seen in
        for idx, match in enumerate(self.matches):
            player1_id = match.player1.team_id
            player2_id = match.player2.team_id
            if last_match[player1_id] != None:
                match.player1 = Winner(last_match[player1_id])
            if last_match[player2_id] != None:
                match.player2 = Winner(last_match[player2_id])
            last_match[player1_id] = idx
            last_match[player2_id] = idx

class DoubleEliminationTournament(Tournament):
    """A double elimination tournament generator"""

    def generate_complete_bracket(self):
        """
        Generates the complete bracket, consistent with a Challonge
        bracket. Assumes that number of players is a power of 2.
        """
        winner_bracket = SingleEliminationTournament(self.bracket_size).generate_bracket()
        offset_match_idx = 0 # An offset for the match indexes, as new matches are added

        def add_matches(matches):
            """Appends a number of matches from the winners bracket"""
            for match in matches:
                if isinstance(match.player1, MatchResultPlayer):
                    match.player1.match_idx += offset_match_idx
                if isinstance(match.player2, MatchResultPlayer):
                    match.player2.match_idx += offset_match_idx
                match.round_str = match.round_str + " (Winners)"
                self.matches += [match]

        num_matches_in_round = self.bracket_size // 2
        # Round 1 Winners
        add_matches(winner_bracket[:num_matches_in_round])
        # Round 1 Losers
        for i in range(0, num_matches_in_round, 2):
            self.matches += [Match(Loser(i), Loser(i + 1), 1.1, "Round 1 (Losers)")]

        # Challonge seems to have the following protocol for generating the losers bracket
        # Starting from Round 2 Losers (both A and B), it cycles between four protocols:
        #  - Decreasing full
        #  - Decreasing half
        #  - Increasing half
        #  - Increasing full
        # What these protocols mean should be clear from their function definitions

        protocols = [DoubleEliminationTournament.protocol_increasing_full,
                     DoubleEliminationTournament.protocol_decreasing_full,
                     DoubleEliminationTournament.protocol_decreasing_half,
                     DoubleEliminationTournament.protocol_increasing_half]
        round_num = 1
        while True:
            # We update the state to satisfy the following invariants:
            #  - protocols[0] is the current protocol
            #  - matches already in self.matches are deleted from winner_bracket
            #  - round_num is the current round number
            protocols = protocols[1:] + protocols[:1] # Bump to next protocol
            winner_bracket = winner_bracket[num_matches_in_round:]
            num_matches_in_round //= 2
            round_num += 1
            if num_matches_in_round == 0:
                break

            previous_losers_start = len(self.matches) - num_matches_in_round

            # Round N Winners
            current_winners_start = len(self.matches)
            add_matches(winner_bracket[:num_matches_in_round])
            # Round N Losers A
            current_losers_start = len(self.matches)
            for i, j in enumerate(protocols[0](num_matches_in_round)):
                self.matches += [Match(Loser(current_winners_start + j),
                                       Winner(previous_losers_start + i),
                                       round_num + 0.1,
                                       "Round {} (Losers A)".format(round_num))]
            # Round N Losers B
            for i in range(0, num_matches_in_round // 2):
                self.matches += [Match(Winner(current_losers_start + 2 * i),
                                       Winner(current_losers_start + 2 * i + 1),
                                       round_num + 0.2,
                                       "Round {} (Losers B)".format(round_num))]

            if offset_match_idx == 0:
                offset_match_idx += num_matches_in_round
            else:
                offset_match_idx += 3 * num_matches_in_round

        # Final #1
        winner_bracket_top = len(self.matches) - 2
        self.matches += [Match(Winner(winner_bracket_top), Winner(winner_bracket_top + 1), round_num, "Round {}".format(round_num))]
        round_num += 1
        # Optional final #2
        self.matches += [Match(Winner(winner_bracket_top + 2), Loser(winner_bracket_top + 2), round_num, "Round {} (if needed)".format(round_num))]

    """
    Below are the four ordering protocols observed in Challonge's losers
    brackets. Empirically determined.
    """
    @staticmethod
    def protocol_increasing_full(n):
        for i in range(n):
            yield i

    @staticmethod
    def protocol_decreasing_full(n):
        for i in range(n - 1, -1, -1):
            yield i

    @staticmethod
    def protocol_increasing_half(n):
        for i in range(n // 2, n):
            yield i
        for i in range(n // 2):
            yield i

    @staticmethod
    def protocol_decreasing_half(n):
        for i in range(n // 2 - 1, -1, -1):
            yield i
        for i in range(n - 1, n // 2 - 1, -1):
            yield i


class TournamentManager:
    """
    A utility that manages a tournament queue using a tournament bracket.
    Accepts and processes match results, and produces lists of ongoing
    matches to monitor and lists of matches ready to be queued.
    """

    class MatchInfo:
        def __init__(self, match_idx, player1_key, player2_key, player1_name, player2_name):
            self.match_idx = match_idx
            self.player1_key = player1_key
            self.player2_key = player2_key
            self.player1_name = player1_name
            self.player2_name = player2_name

        def __str__(self):
            return '[{0:>4}]: {1} ({2}) -vs- {3} ({4})'.format(
                self.match_idx,
                self.player1_key, self.player1_name,
                self.player2_key, self.player2_name)

    def __init__(self, bracket, team_keys, team_names):
        """
        Initialises this tournament bracket. Requires the following
        parameters:
         - bracket:    a Tournament instance containing the bracket to be
                       used for running this tournament
         - team_keys:  a list of unique identifying keys for each team,
                       which may be useful in tournament starter procedures
         - team_names: a list of team names, used in human-readable log
                       outputs
        """
        if not isinstance(bracket, Tournament):
            raise TypeError("bracket must be a Tournament")

        self.bracket = bracket
        self.team_keys = team_keys
        self.team_names = team_names

        self.ready = set()
        self.running = set()
        self.match_is_prerequisite_of = []
        for idx, match in enumerate(self.bracket.matches):
            self.match_is_prerequisite_of += [[]]
            if isinstance(match.player1, MatchResultPlayer):
                self.match_is_prerequisite_of[match.player1.match_idx] += [(idx, 1)]
            if isinstance(match.player2, MatchResultPlayer):
                self.match_is_prerequisite_of[match.player2.match_idx] += [(idx, 2)]
            # If this match is ready to be played, add it to the game queue
            if isinstance(match.player1, Team) and isinstance(match.player2, Team):
                self.ready.add(TournamentManager.MatchInfo(idx,
                    self.team_keys[match.player1.team_id],
                    self.team_keys[match.player2.team_id],
                    self.team_names[match.player1.team_id],
                    self.team_names[match.player2.team_id]))

    def match_enqueue(self, match, starter):
        """
        Enqueues a ready match by calling the provided starter function.
        Updates the tournament manager's internal state to reflect this.
        """
        if match not in self.ready:
            raise ValueError("this match is not marked as ready")

        logging.info("Adding match [{}] to queue: {} vs {}".format(match.match_idx,
            match.player1_name, match.player2_name))
        self.ready.remove(match)
        starter(match)
        self.running.add(match)

    def match_report_winner(self, match, winner):
        """
        Reports the outcome of a game, updating the tournament manager's
        internal state. Parameters:
         - match must be a MatchInfo instance
         - winner must be either 1 or 2
        """
        if match not in self.running:
            raise ValueError("this match is not currently running")

        logging.info("Match [{}] won by {}".format(
            match.match_idx,
            match.player1_name if winner == 1 else match.player2_name))
        self.running.remove(match)
        self.bracket.matches[match.match_idx].report_winner(winner)

        # Check if new matches are now ready to be played
        for next_match, playernum in self.match_is_prerequisite_of[match.match_idx]:
            if playernum == 1:
                self.bracket.matches[next_match].player1 = Team(self.bracket.matches[next_match].player1.get_team_id(self.bracket.matches))
            else:
                self.bracket.matches[next_match].player2 = Team(self.bracket.matches[next_match].player2.get_team_id(self.bracket.matches))
            if isinstance(self.bracket.matches[next_match].player1, Team) and isinstance(self.bracket.matches[next_match].player2, Team):
                self.ready.add(TournamentManager.MatchInfo(next_match,
                    self.team_keys[self.bracket.matches[next_match].player1.team_id],
                    self.team_keys[self.bracket.matches[next_match].player2.team_id],
                    self.team_names[self.bracket.matches[next_match].player1.team_id],
                    self.team_names[self.bracket.matches[next_match].player2.team_id]))

    def is_complete(self):
        return (not self.ready) and (not self.running)


def dump_json(n, ouf):
    """Dumps the tournament bracket as JSON for use by bracket viewer"""

    tournament = DoubleEliminationTournament(n)
    tournament.generate_bracket()
    data = { }
    data['tournament_name'] = input('Name of tournament: ')
    data['rounds'] = []
    data['matches'] = []

    with open(FILE_TEAMNAMES, 'r') as f:
        team_names = f.read().split('\n')

    def to_json_object(entity):
        if isinstance(entity, Team):
            return { 'seed': entity.team_id+1, 'name': team_names[entity.team_id] }
        elif isinstance(entity, Winner):
            return { 'depends_on': entity.match_idx, 'type': 'Winner' }
        elif isinstance(entity, Loser):
            return { 'depends_on': entity.match_idx, 'type': 'Loser' }
        else:
            raise ValueError('unknown entity')

    for match in tournament.matches:
        if not data['rounds'] or data['rounds'][-1]['name'] != match.round_str:
            data['rounds'] += [{
                'name': match.round_str,
                'num_games': 0
            }]
        data['rounds'][-1]['num_games'] += 1
        data['matches'] += [{
            'player1': to_json_object(match.player1),
            'player2': to_json_object(match.player2),
            'complete': False
        }]

    with open(ouf, 'w') as f:
        f.write(json.dumps(data))

if __name__ == '__main__':
    n = int(sys.argv[1])
    ouf = sys.argv[2]
    dump_json(n, ouf)
