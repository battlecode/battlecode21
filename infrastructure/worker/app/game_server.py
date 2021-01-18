#!/usr/bin/env python3

# This server subscribes to the gcloud scrimmage pub-sub -- basically a queue of scrimmages
# that need running. It will do its best to accomplish this, and report success or failure
# to the pubsub and backend.

import subscription, util
from config import *

import sys, os, shutil, logging, requests, json, re
from google.cloud import storage


def game_report_result(gametype, gameid, result, winscore=None, losescore=None, reason=''):

    """Sends the result of the run to the API endpoint"""
    try:
        auth_token = util.get_api_auth_token()
        response = requests.patch(url=api_game_update(gametype, gameid), data={
            'status': result,
            'winscore': winscore,
            'losescore': losescore,
            'error_msg': reason
        }, headers={
            'Authorization': 'Bearer {}'.format(auth_token)
        })
        response.raise_for_status()
    except Exception as e:
        logging.critical('Could not report result to API endpoint', exc_info=e)
        sys.exit(1)

def game_log_error(gametype, gameid, reason): #For when the game fails and it is our fault
    """Reports a server-side error to the backend and terminates with failure"""
    logging.error(reason)
    game_report_result(gametype, gameid, GAME_ERROR, reason=reason)
    sys.exit(1)

def game_log_fail(gametype, gameid, reason): #For when the game fails and its not our fault
    logging.error(reason)
    game_report_result(gametype, gameid, GAME_ERROR, reason=reason)

def game_worker(gameinfo):
    """
    Runs a game as specified by the message
    Message contains JSON data, with string parameters:
        gametype: string, either "scrimmage" or "tournament"
        gameid:   string, id of the game
        player1:  string, id of red player submission
        player2:  string, id of blue player submission
        name1:    string, team name of the red player
        name2:    string, team name of the blue player
        maps:     string, comma separated list of maps
        replay:   string, a unique identifier for the name of the replay
        tourmode: string, "True" to use an experimental tournament mode

    Filesystem structure:
    /box/
        `-- classes/
        |   `-- player1.zip
        |   `-- player2.zip
        |   `-- player1/
        |   |   `-- <player1 package>/
        |   |       `-- all compiled .class files in player1.zip
        |   `-- player2/
        |       `-- <player2 package>/
        |           `-- all compiled .class files in player2.zip
        `-- build/
        |   `-- some nonsense that gradle creates
        `-- replay.bc20
    """

    client = storage.Client()
    bucket = client.get_bucket(GCLOUD_BUCKET_SUBMISSION)

    try:
        gameinfo = json.loads(gameinfo)
        gametype = gameinfo['gametype']
        gameid   = gameinfo['gameid']
        player1  = gameinfo['player1']
        player2  = gameinfo['player2']
        maps     = gameinfo['maps']
        replay   = gameinfo['replay']
        tourmode = False
        if 'tourmode' in gameinfo and gameinfo['tourmode'] == 'True':
            tourmode = True
        print("Tour mode:", tourmode)

        # For reverse-compatibility
        if 'name1' in gameinfo:
            teamname1 = gameinfo['name1']
        else:
            teamname1 = player1
        if 'name2' in gameinfo:
            teamname2 = gameinfo['name2']
        else:
            teamname2 = player2
    except Exception as ex:
        game_log_error(gametype, gameid, 'Game information in incorrect format')
        


    rootdir  = os.path.join('/', 'box')
    classdir = os.path.join(rootdir, 'classes')
    builddir = os.path.join(rootdir, 'build')

    try:
        # Obtain player executables
        attempts = 10
        for i in range(attempts):
            try:
                os.mkdir(classdir)
                with open(os.path.join(classdir, 'player1.zip'), 'wb') as file_obj:
                    bucket.get_blob(os.path.join(player1, 'player.zip')).download_to_file(file_obj)
                with open(os.path.join(classdir, 'player2.zip'), 'wb') as file_obj:
                    bucket.get_blob(os.path.join(player2, 'player.zip')).download_to_file(file_obj)

                break # exit loop and continue on our merry way
            except:
                if i >= attempts-1: #Tried {attempts} times, give up
                    game_log_error(gametype, gameid, 'Could not retrieve submissions from bucket')
                else: #Try again
                    logging.warn('Could not retrieve submissions from bucket, retrying...')

        # Decompress zip archives of player classes
        try:
            # Unzip player 1
            result = util.monitor_command(
                ['unzip', 'player1.zip', '-d', 'player1'],
                cwd=classdir,
                timeout=TIMEOUT_UNZIP)
            if result[0] != 0:
                raise RuntimeError
            # Unzip player 2
            result = util.monitor_command(
                ['unzip', 'player2.zip', '-d', 'player2'],
                cwd=classdir,
                timeout=TIMEOUT_UNZIP)
            if result[0] != 0:
                raise RuntimeError
        except:
            game_log_error(gametype, gameid, 'Could not decompress player zips')

        # Determine player packages
        try:
            package1 = os.listdir(os.path.join(classdir, 'player1'))
            assert (len(package1) == 1)
            package1 = package1[0]
            package2 = os.listdir(os.path.join(classdir, 'player2'))
            assert (len(package2) == 1)
            package2 = package2[0]
        except:
            game_log_error(gametype, gameid, 'Could not determine player packages')

        # Update distribution
        util.pull_distribution(rootdir, lambda: game_log_error(gametype, gameid, 'Could not pull distribution'))

        # Prep maps
        # We want the maps as a list, so we can iterate.
        # For tournament mode, we want to split up map list into separate parts so we can run on each map individually;
        # For regular mode, we want to pass the map list in as a string of comma-separated maps,
        # but we wrap it in a list so we can "iterate" still while retaining old behavior.
        if tourmode:
            maps = maps.split(',')
        else:
            maps = [maps]

        # Initialize win count, to count for each game
        wins_overall = [0, 0]

        # For tour mode, game_number represents which game (of a match) we're in;
        # in regular mode, game_number only takes on a value of 0 and doesn't really mean much
        # (since all the maps get played in the the same engine run)
        for game_number in range (0, len(maps)):
            # Prep game arguments, making sure to switch teams each game.
            # If game_number is even, then team A in the engine is player1, etc.
            teamA_is_player1 = (game_number%2==0)
            player1_info = (teamname1, os.path.join(classdir, 'player1'), package1)
            player2_info = (teamname2, os.path.join(classdir, 'player2'), package2)
            (teamA_arg, classLocationA_arg, packageNameA_arg) = player1_info if teamA_is_player1 else player2_info
            (teamB_arg, classLocationB_arg, packageNameB_arg) = player2_info if teamA_is_player1 else player1_info
            maps_arg = maps[game_number]
            # Execute game
            result = util.monitor_command(
                ['./gradlew', 'run',
                    '-PteamA={}'.format(teamA_arg),
                    '-PteamB={}'.format(teamB_arg),
                    '-PclassLocationA={}'.format(classLocationA_arg),
                    '-PclassLocationB={}'.format(classLocationB_arg),
                    '-PpackageNameA={}'.format(packageNameA_arg),
                    '-PpackageNameB={}'.format(packageNameB_arg),
                    '-Pmaps={}'.format(maps_arg),
                    '-Preplay=replay.bc21'
                ],
                cwd=rootdir,
                timeout=TIMEOUT_GAME)

            if result[0] != 0:
                game_log_error(gametype, gameid, 'Game execution had non-zero return code')

            # Upload replay file
            # In tour mode, we create the replay link by appending the match number to the replay hex
            replay_id = replay
            if tourmode:
                replay_id += '-' + str(game_number)
            bucket = client.get_bucket(GCLOUD_BUCKET_REPLAY)
            try:
                with open(os.path.join(rootdir, 'replay.bc21'), 'rb') as file_obj:
                    bucket.blob(os.path.join('replays', '{}.bc21'.format(replay_id))).upload_from_file(file_obj)
            except:
                game_log_error(gametype, gameid, 'Could not send replay file to bucket')

            # Interpret game result
            server_output = result[1].split('\n')

            wins = [0, 0]
            try:
                # Read the winner of each game from the engine
                for line in server_output:
                    if re.fullmatch(GAME_WINNER, line):
                        game_winner = line[line.rfind('wins')-3]
                        assert (game_winner == 'A' or game_winner == 'B')
                        if game_winner == 'A':
                            wins[0] += 1
                        elif game_winner == 'B':
                            wins[1] += 1
                # We should have as many game wins as games played
                assert (wins[0] + wins[1] == len(maps_arg.split(',')))
                logging.info('Game ended. Result {}:{}'.format(wins[0], wins[1]))
            except:
                game_log_error(gametype, gameid, 'Could not determine winner')
            else:
                # Tally up these wins
                # wins_overall is in order [player1, player2]
                # wins is in order [teamA, teamB]
                if teamA_is_player1:
                    wins_overall[0] += wins[0]
                    wins_overall[1] += wins[1]
                else:
                    wins_overall[0] += wins[1]
                    wins_overall[1] += wins[0]

        # Find the overall winner
        logging.info('Match ended. Result {}:{}'.format(wins_overall[0], wins_overall[1]))
        if wins_overall[0] > wins_overall[1]:
            game_report_result(gametype, gameid, GAME_REDWON, wins_overall[0], wins_overall[1])
        elif wins_overall[1] > wins_overall[0]:
            game_report_result(gametype, gameid, GAME_BLUEWON, wins_overall[1], wins_overall[0])
        else:
            game_log_error(gametype, gameid, 'Ended in draw, which should not happen')

    finally:
        # Clean up working directory
        try:
            shutil.rmtree(classdir)
            shutil.rmtree(builddir)
            os.remove(os.path.join(rootdir, 'replay.bc21'))
        except:
            logging.warning('Could not clean up game execution directory')


if __name__ == '__main__':
    subscription.subscribe(GCLOUD_SUB_GAME_NAME, game_worker, give_up=True)
