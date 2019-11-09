#!/usr/bin/env python3

import subscription, util
from config import *

import sys, os, shutil
import logging
import requests
from google.cloud import storage


def game_db_report(gameid, result):
    """Sends the result of the run to the database API endpoint"""
    try:
        response = requests.post(url=API_GAME, data={
            'gameid': gameid,
            'result': result})
        response.raise_for_status()
    except:
        logging.critical('Could not report to database API endpoint')
        sys.exit(1)

def game_log_error(gameid, reason):
    """Reports a server-side error to the database and terminates with failure"""
    logging.error(reason)
    game_db_report(gameid, 'error')
    sys.exit(1)

def game_worker(gameinfo):
    """
    Runs a game as specified by the message
    Message format: {gameid};{submissionid1};{submissionid2}
    Components delimited by semicolons
    """

    client = storage.Client()
    bucket = client.get_bucket(GCLOUD_BUCKET_ID)

    try:
        gameid, player1, player2 = gameinfo.split(';')
    except:
        game_log_error('Game information in incorrect format')

    # Filesystem structure:
    # /tmp/bc20-game-{gameid}/
    #     `-- player1.zip
    #     `-- player2.zip
    rootdir = os.path.join('/', 'tmp', 'bc20-game-'+gameid)

    # Obtain player executables
    try:
        os.mkdir(rootdir)
        with open(os.path.join(rootdir, 'player1.zip'), 'wb') as file_obj:
            bucket.get_blob(os.path.join(player1, 'player.zip')).download_to_file(file_obj)
        with open(os.path.join(rootdir, 'player2.zip'), 'wb') as file_obj:
            bucket.get_blob(os.path.join(player2, 'player.zip')).download_to_file(file_obj)
    except:
        game_log_error(gameid, 'Could not retrieve executables from bucket')

    result = util.monitor_command(
        ['git', 'pull'],
        cwd=PATH_DIST,
        timeout=TIMEOUT_PULL)

    # TODO: unzip player zips

    # TODO: Invoke game and interpret game result
    result = util.monitor_command(
        ['java', '-jar', PATH_ENGINE,
            '-Dbc.server.mode=headless'
        ],
        cwd=sourcedir,
        timeout=TIMEOUT_GAME)

    if result[0] != 0:
        game_log_error(gameid, 'Game execution had non-zero return code')

    # TODO: Interpret game result to send to database
    game_db_report(gameid, 'win')

    # Clean up working directory
    try:
        shutil.rmtree(rootdir)
    except:
        logging.warning('Could not clean up game execution directory')

if __name__ == '__main__':
    subscription.subscribe(GCLOUD_SUB_GAME_NAME, game_worker)
