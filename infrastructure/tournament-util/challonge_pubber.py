# Usage:
# python challonge_pubber.py argv
# argv[1]: a json produced by running the tournmanet
# argv[2]: the challonge match number (as shown on the bracket page) of the first Challonge match (or, if argv[3] not specified, the only challonge match) whose result is to be published
# argv[3]: optional; the challonge match number of the last Challonge match to be published, _exclusive_.

# IMPORTANT -- Before running this:
# Get the Challonge API Key, substitute it for API_KEY below. DON'T PUSH IT!
# Get the tournament url, it's the alphanumeric string at the end of the tournament website's url. (e.g. http://challonge.com/thispart)
# Get the lowest Challonge match id (see some commented code for an example). Set it to lowest_id.
# Ensure the tournament is started and attachments are allowed (see some commented code for more info).

import sys, json, challonge, asyncio

replay_file_name = sys.argv[1]
match_no_start = int(sys.argv[2])
try:
    match_no_end = int(sys.argv[3])
except:
    match_no_end = match_no_start


async def run():
    with open(replay_file_name, 'r') as replay_file:
        replays = json.load(replay_file)
        user = await challonge.get_user('mitbattlecode','API_KEY')
        
        tournament = await user.get_tournament(url = 'guxnrz5')
        # # To ensure tournament is started and attachments are allowed; only needs to be run once
        # await tournament.start()
        # await tournament.allow_attachments(True)

        # # For getting the lowest challonge match id:
        # tournament_matches = await tournament.get_matches()
        # for m in tournament_matches:
        #     print(m.id)
        # # (then look through this)
        lowest_id = 225020428

        for match_no in range(match_no_start, match_no_end):
            match = replays[match_no - 1] # note -1, for proper indexing: challonge is 1-indexed while the json is 0
            api_match = await tournament.get_match(match_no + lowest_id - 1) # note -1, for proper indexing: lowest_id corresponds to match number 1
            api_player1 = await tournament.get_participant( api_match.player1_id )
            api_player2 = await tournament.get_participant( api_match.player2_id )


            player1 = match[0][0]
            player2 = match[0][1]

            player1_score = 0
            player2_score = 0

            for game in match:
                p_red = game[0]
                p_blue = game[1]
                map = game[2]
                winner = p_red if game[3] == 1 else p_blue
                replay = game[4]

                if winner == player1:
                    player1_score += 1
                else:
                    player2_score += 1

                replayurl = f'http://2021.battlecode.org/visualizer.html?tournamentMode&https://2021.battlecode.org/replays/{replay}.bc21'
                await api_match.attach_url(replayurl)

            if player1_score > player2_score:
                await api_match.report_winner(api_player1, f'{player1_score}-{player2_score}')
            else:
                await api_match.report_winner(api_player2, f'{player1_score}-{player2_score}')


loop = asyncio.get_event_loop()
loop.run_until_complete(run())
loop.close()