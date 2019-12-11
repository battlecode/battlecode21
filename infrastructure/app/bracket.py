"""
A double-elimination bracket generator
Reverse-engineering Challonge is, like, work
"""

import sys
import heapq

class Entity:
    """A class for a generic team-like entity"""

    def __init__(self):
        raise NotImplementedError

    def get_team_id(self, matches):
        raise NotImplementedError

class Team(Entity):
    """A class that represents a specific team"""

    def __init__(self, team_id):
        self.team_id = team_id

    def __str__(self):
        return 'Team #{}'.format(self.team_id + 1).ljust(16)

    def get_team_id(self):
        return self.team_id

    def get_team_id(self, matches):
        return self.team_id

class MatchResultPlayer(Entity):
    """A class that represents the winner or loser of a particular match"""

    def __init__(self, match_idx):
        self.match_idx = match_idx

    def __str__(self):
        return 'Player in [{}]'.format(self.match_idx + 1).ljust(16)

class Winner(MatchResultPlayer):
    """A class that represents the winner of a particular match"""

    def __str__(self):
        return 'Winner of [{}]'.format(self.match_idx + 1).ljust(16)

    def get_team_id(self, matches):
        """Retrieve the actual team represented by this object"""
        return matches[self.match_idx].winner

class Loser(MatchResultPlayer):
    """A class that represents the loser of a particular match"""

    def __str__(self):
        return 'Loser  of [{}]'.format(self.match_idx + 1).ljust(16)

    def get_team_id(self, matches):
        """Retrieve the actual team represented by this object"""
        return matches[self.match_idx].loser

class Match:
    """A class that holds information about a match"""

    def __init__(self, player1, player2, round):
        self.player1 = player1
        self.player2 = player2
        self.winner = None
        self.loser = None
        self.round = round

    def __str__(self):
        return '[Round %s]  %s -vs- %s' % \
            (self.round.rjust(6), self.player1, self.player2)

    def report_winner(self, winner):
        if winner == self.player1:
            self.winner, self.loser = self.player1, self.player2
        elif winner == self.player2:
            self.winner, self.loser = self.player2, self.player1
        else:
            assert(winner == self.player1 or winner == self.player2)


class Tournament:
    """
    A generic tournament bracket generator.
    Rounds number of players up to a power of 2 for easier use in a
    specific algorithm, and then prunes the generated bracket to remove
    auxiliary players.
    """

    def __init__(self, num_players):
        """Initialise with number of players and round up to power of 2"""
        self.actual_num_players = num_players
        self.num_players = num_players
        while self.num_players != (self.num_players & (-self.num_players)):
            self.num_players += (self.num_players & (-self.num_players))

    def generate_bracket(self):
        """Entrypoint for generating a new bracket"""
        self.matches = []
        self.generate_complete_bracket()
        self.prune_extra_players()
        self.reorder_matches()
        return self.matches

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
                if player.team_id < self.actual_num_players:
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
                new_matches += [Match(player1_entity, player2_entity, match.round)]
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
                heapq.heappush(queue, (match.round, push_idx, idx))
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
                    heapq.heappush(queue, (self.matches[next_match].round, push_idx, next_match))
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
        if cur_players == self.num_players:
            return # No more players to be added
        new_players = []
        new_matches = []
        for player in player_ids:
            opponent = cur_players * 2 - player - 1
            new_matches += [Match(Team(player), Team(opponent), None)]
            new_players += [player, opponent]
        # Recursive call to get the previous round
        self.generate_recursive_bracket(new_players)
        # Update the actual round number for this round
        my_round = str(int(self.matches[-1].round) + 1) if self.matches else "1"
        for match in new_matches:
            match.round = my_round
        self.matches += new_matches

    def postprocess(self):
        """
        Postprocesses the recursively built bracket. In particular,
        replaces Teams with MatchResultPlayers as appropriate in the
        bracket.
        """
        last_match = [None] * (self.num_players) # Last match that this player was seen in
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
        winner_bracket = SingleEliminationTournament(self.num_players).generate_bracket()
        offset_match_idx = 0 # An offset for the match indexes, as new matches are added

        def add_matches(matches):
            """Appends a number of matches from the winners bracket"""
            for match in matches:
                if isinstance(match.player1, MatchResultPlayer):
                    match.player1.match_idx += offset_match_idx
                if isinstance(match.player2, MatchResultPlayer):
                    match.player2.match_idx += offset_match_idx
                match.round = (match.round + "   W").rjust(6)
                self.matches += [match]

        num_matches_in_round = self.num_players // 2
        # Round 1 Winners
        add_matches(winner_bracket[:num_matches_in_round])
        # Round 1 Losers
        for i in range(0, num_matches_in_round, 2):
            self.matches += [Match(Loser(i), Loser(i + 1), "1 L-A".rjust(6))]

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
                self.matches += [Match(Loser(current_winners_start + i),
                                       Winner(previous_losers_start + j),
                                       "{} L-A".format(round_num).rjust(6))]
            # Round N Losers B
            for i in protocols[0](num_matches_in_round // 2):
                # Under certain conditions, the two players in a match are reversed
                if protocols[0] == DoubleEliminationTournament.protocol_increasing_full or \
                    protocols[0] == DoubleEliminationTournament.protocol_increasing_half or \
                    num_matches_in_round == 2:
                    self.matches += [Match(Winner(current_losers_start + 2 * i),
                                           Winner(current_losers_start + 2 * i + 1),
                                           "{} L-B".format(round_num).rjust(6))]
                else:
                    self.matches += [Match(Winner(current_losers_start + 2 * i + 1),
                                           Winner(current_losers_start + 2 * i),
                                           "{} L-B".format(round_num).rjust(6))]

            if offset_match_idx == 0:
                offset_match_idx += num_matches_in_round
            else:
                offset_match_idx += 3 * num_matches_in_round

        # Final #1
        winner_bracket_top = len(self.matches) - 2
        self.matches += [Match(Winner(winner_bracket_top), Winner(winner_bracket_top + 1), "Fin-1")]
        # Optional final #2
        self.matches += [Match(Winner(winner_bracket_top + 2), Loser(winner_bracket_top + 2), "Fin-2")]

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


if __name__ == '__main__':
    n = int(sys.argv[1])

    tourney = DoubleEliminationTournament(n)
    matches = tourney.generate_bracket()
    for idx, match in enumerate(matches):
        print ('[{0:>4}]: {1}'.format(idx + 1, match).rjust(50))
