#!/usr/bin/env python3

import subscription, util
from config import *

import sys, os, shutil, logging, requests, json, re
from google.cloud import storage


def game_report_result(gametype, gameid, result):
    """Sends the result of the run to the API endpoint"""
    try:
        auth_token = util.get_api_auth_token()
        response = requests.patch(url=api_game_update(gametype, gameid), data={
            'status': result
        }, headers={ # TODO: remove auth tokens, or make optional
            'Authorization': 'Bearer {}'.format(auth_token)
        })
        response.raise_for_status()
    except Exception as e:
        logging.critical('Could not report result to API endpoint', exc_info=e)
        sys.exit(1)

def game_log_error(gametype, gameid, reason):
    """Reports a server-side error to the backend and terminates with failure"""
    logging.error(reason)
    game_report_result(gametype, gameid, GAME_ERROR)
    sys.exit(1)

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
        replay:   string, a unique identifier for the name of the replay

    Filesystem structure:
    /box/
        `-- bots/
        |   `-- player1.zip
        |   `-- player2.zip
        |   `-- player1/
        |   |   `-- <player1 package>/
        |   |       `-- all .py files in player1.zip
        |   `-- player2/
        |       `-- <player2 package>/
        |           `-- all .py files in player2.zip
        `-- replay.txt
    """

    client = storage.Client()
    bucket = client.get_bucket(GCLOUD_BUCKET_SUBMISSION)

    try:
        gameinfo = json.loads(gameinfo)
        gametype = gameinfo['gametype']
        gameid   = gameinfo['gameid']
        teamname1  = gameinfo['player1']
        teamname2  = gameinfo['player2']
        replay   = gameinfo['replay']

        # For reverse-compatibility
    except:
        game_log_error(gametype, gameid, 'Game information in incorrect format')

    rootdir  = os.path.join('/', 'box')
    botdir = os.path.join(rootdir, 'bots')

    try:
        # Obtain player executables
        try:
            os.mkdir(botdir)
            with open(os.path.join(botdir, 'player1.zip'), 'wb') as file_obj:
                bucket.get_blob(os.path.join(player1, 'player.zip')).download_to_file(file_obj)
            with open(os.path.join(botdir, 'player2.zip'), 'wb') as file_obj:
                bucket.get_blob(os.path.join(player2, 'player.zip')).download_to_file(file_obj)
        except:
            game_log_error(gametype, gameid, 'Could not retrieve submissions from bucket')

        # Decompress zip archives of player classes
        try:
            # Unzip player 1
            result = util.monitor_command(
                ['unzip', 'player1.zip', '-d', 'player1'],
                cwd=botdir,
                timeout=TIMEOUT_UNZIP)
            if result[0] != 0:
                raise RuntimeError
            # Unzip player 2
            result = util.monitor_command(
                ['unzip', 'player2.zip', '-d', 'player2'],
                cwd=botdir,
                timeout=TIMEOUT_UNZIP)
            if result[0] != 0:
                raise RuntimeError
        except:
            game_log_error(gametype, gameid, 'Could not decompress player zips')

        # Determine player packages
        try:
            package1 = os.listdir(os.path.join(botdir, 'player1'))
            assert (len(package1) == 1)
            package1 = os.path.join( botdir, "player1", package1[0] )
            package2 = os.listdir(os.path.join(botdir, 'player2'))
            assert (len(package2) == 1)
            package2 = os.path.join(botdir, "player2", package2[0] )
        except:
            game_log_error(gametype, gameid, 'Could not determine player packages')

        # Update distribution
        # TODO: Update this with pypi upon release
        # util.pull_distribution(rootdir, lambda: game_log_error(gametype, gameid, 'Could not pull distribution'))

        # Execute game
        result = util.monitor_command(
            ['python', 'engine/main.py',
                package1,
                package2,

                '>>',
                'replay.txt'
            ],
            cwd=os.path.join(rootdir),
            timeout=TIMEOUT_GAME)

        if result[0] != 0:
            game_log_error(gametype, gameid, 'Game execution had non-zero return code')

        # Upload replay file
        bucket = client.get_bucket(GCLOUD_BUCKET_REPLAY)
        try:
            with open(os.path.join(rootdir, 'replay.txt'), 'rb') as file_obj:
                bucket.blob(os.path.join('replays', '{}.txt'.format(replay))).upload_from_file(file_obj)
        except:
            game_log_error(gametype, gameid, 'Could not send replay file to bucket')

        # Interpret game result
        server_output = result[1].split('\n')

        wins = [0, 0]
        try:
            # Read the winner of each game from the engine
            for line in server_output:
                if re.fullmatch('Team.White wins!', line):
                    game_winner = 'A'
                    wins[0] += 1
                elif re.fullmatch('Team.Black wins!', line):
                    game_winner = 'B'
                    wins[1] += 0
                    assert (game_winner == 'A' or game_winner == 'B')

            logging.info('Game ended. Result {}:{}'.format(wins[0], wins[1]))
        except:
            game_log_error(gametype, gameid, 'Could not determine winner')
        else:
            if wins[0] > wins[1]:
                game_report_result(gametype, gameid, GAME_REDWON)
            elif wins[1] > wins[0]:
                game_report_result(gametype, gameid, GAME_BLUEWON)
            else:
                game_log_error(gametype, gameid, 'Ended in draw, which should not happen')

    finally:
        # Clean up working directory
        try:
            shutil.rmtree(botdir/)
            os.remove(os.path.join(rootdir, 'replay.bc20'))
        except:
            logging.warning('Could not clean up game execution directory')


if __name__ == '__main__':
    subscription.subscribe(GCLOUD_SUB_GAME_NAME, game_worker, give_up=False)
