# Requires achallonge, and _not_ pychal. Make sure to `pip uninstall pychal`, `pip install achallonge` etc before using.

# IMPORTANT -- BEFORE RUNNING THIS:
# Get the Challonge API Key. Set it to an env, CHALLONGE_API_KEY. DON'T PUSH NOR SCREENSHARE/STREAM IT!
# Get the tournament url, it's the alphanumeric string at the end of the tournament website's url. (e.g. http://challonge.com/thispart). Set it to an env, CHALLONGE_TOUR_URL.
# Now with all those set, run the script as specified directly below:

# Usage:
# python challonge_pubber.py path/to/json.json start end
# path/to/json: a json produced by running the tour. Get this from someone who ran the tournament.
# start: the challonge match number (as shown on the bracket page) of the first Challonge match (or, if argv[3] not specified, the only challonge match) whose result is to be published
# end: optional; the challonge match number of the last Challonge match to be published, _exclusive_.
# e.g. python challonge_pubber.py path/to/replay_dump.json 1 4
# will publish the results of the Challonge bracket's matches 1, 2, and 3.

import sys, json, challonge, asyncio, os

async def run():
    print("Setting up...\n")
    try: 
        api_key = os.getenv('CHALLONGE_API_KEY')
        user = await challonge.get_user('mitbattlecode',api_key)
        
        tour_url = os.getenv('CHALLONGE_TOUR_URL')
        tournament = await user.get_tournament(url = tour_url)
    except:
        print("Make sure you have properly configured CHALLONGE_API_KEY and CHALLONGE_TOUR_URL.")
        print("See the comments at the top of this file for instructions.")
        raise Exception

    # To ensure tournament is started and attachments are allowed. 
    # Only needs to be run once per tournament.
    # But, we run it every time the script is run: this can be run unlimited times, and is pretty quick.
    # Also makes the script much simpler to use.
    await tournament.start()
    await tournament.allow_attachments(True)

    # We map matches' suggested play order to their match objects, so that we can easily access the matches.
    # This is because we (battlecode) play matches in their suggested play order, and so suggested play order is the index that we use.
    # There's no way to directly access the match objects by their suggested play order, so we need some preprocessing.
    match_play_order_dict = dict()
    tournament_matches = await tournament.get_matches()
    for m in tournament_matches:
        suggested_play_order = m.suggested_play_order
        match_play_order_dict[suggested_play_order] = m

    replay_file_name = sys.argv[1]
    match_no_start = int(sys.argv[2])
    try:
        match_no_end = int(sys.argv[3])
    except:
        match_no_end = match_no_start+1

    with open(replay_file_name, 'r') as replay_file:
        replays = json.load(replay_file)

        for match_no in range(match_no_start, match_no_end):
            print(f'Reporting match {match_no}')
            match = replays[match_no - 1] # note -1, for proper indexing: challonge is 1-indexed while the json is 0
            api_match = match_play_order_dict[match_no]
            api_player1 = await tournament.get_participant( api_match.player1_id )
            api_player2 = await tournament.get_participant( api_match.player2_id )


            player1 = match[0][0]
            player2 = match[0][1]

            if (api_player1.display_name != player1) or (api_player2.display_name != player2):
                print("Match's player names on json do not match those on Challonge.")
                print("Check proper entry/order of participants on Challonge, and correct match ordering in json.")
                raise Exception

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

            print(f'Match {match_no} reported!\n')


loop = asyncio.get_event_loop()
loop.run_until_complete(run())
loop.close()
