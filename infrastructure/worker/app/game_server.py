#!/usr/bin/env python3

import subscription, util
from config import *

import sys, os, shutil
import logging
import requests
import json, re
from google.cloud import storage


def game_report_result(gametype, gameid, result):
    """Sends the result of the run to the API endpoint"""
    try:
        auth_token = util.get_api_auth_token()
        response = requests.patch(url=api_game_update(gametype, gameid), data={
            'status': result
        }, headers={
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
        maps:     string, comma separated list of maps
        replay:   string, a unique identifier for the name of the replay

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

        # For reverse-compatibility
        if 'name1' in gameinfo:
            teamname1 = gameinfo['name1']
        else:
            teamname1 = player1
        if 'name2' in gameinfo:
            teamname2 = gameinfo['name2']
        else:
            teamname2 = player2
    except:
        game_log_error(gametype, gameid, 'Game information in incorrect format')

    rootdir  = os.path.join('/', 'box')
    classdir = os.path.join(rootdir, 'classes')
    builddir = os.path.join(rootdir, 'build')

    try:
        # Obtain player executables
        try:
            os.mkdir(classdir)
            with open(os.path.join(classdir, 'player1.zip'), 'wb') as file_obj:
                bucket.get_blob(os.path.join(player1, 'player.zip')).download_to_file(file_obj)
            with open(os.path.join(classdir, 'player2.zip'), 'wb') as file_obj:
                bucket.get_blob(os.path.join(player2, 'player.zip')).download_to_file(file_obj)
        except:
            game_log_error(gametype, gameid, 'Could not retrieve submissions from bucket')

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

        # Execute game
        result = util.monitor_command(
            ['./gradlew', 'run',
                '-PteamA={}'.format(teamname1),
                '-PteamB={}'.format(teamname2),
                '-PclassLocationA={}'.format(os.path.join(classdir, 'player1')),
                '-PclassLocationB={}'.format(os.path.join(classdir, 'player2')),
                '-PpackageNameA={}'.format(package1),
                '-PpackageNameB={}'.format(package2),
                '-Pmaps={}'.format(maps),
                '-Preplay=replay.bc20'
            ],
            cwd=rootdir,
            timeout=TIMEOUT_GAME)

        if result[0] != 0:
            game_log_error(gametype, gameid, 'Game execution had non-zero return code')

        # Upload replay file
        bucket = client.get_bucket(GCLOUD_BUCKET_REPLAY)
        try:
            with open(os.path.join(rootdir, 'replay.bc20'), 'rb') as file_obj:
                bucket.blob(os.path.join('replays', '{}.bc20'.format(replay))).upload_from_file(file_obj)
        except:
            game_log_error(gametype, gameid, 'Could not send replay file to bucket')

        # Interpret game result
        server_output = result[1].decode().split('\n')

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
            assert (wins[0] + wins[1] == len(maps.split(',')))
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
            shutil.rmtree(classdir)
            shutil.rmtree(builddir)
            os.remove(os.path.join(rootdir, 'replay.bc20'))
        except:
            logging.warning('Could not clean up game execution directory')


if __name__ == '__main__':
    subscription.subscribe(GCLOUD_SUB_GAME_NAME, game_worker)
