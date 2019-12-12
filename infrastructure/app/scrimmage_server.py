#!/usr/bin/env python3

import util
from config import *

import logging
import time
import requests


def request_scrimmages():
    """Generates scrimmages and publishes them to the queue"""
    try:
        auth_token = util.get_api_auth_token()
        response = requests.post(url=API_SCRIMMAGE_MATCHMAKE, headers={
            'Authorization': 'Bearer {}'.format(auth_token)
        })
        response.raise_for_status()
    except:
        logging.critical('Error while generating scrimmages')


if __name__ == '__main__':
    while True:
        logging.info('Requesting scrimmage matchmaking from backend')
        request_scrimmages()
        logging.info('Request finished, sleeping for {} seconds'.format(SCRIMMAGE_GENERATE_INTERVAL))
        time.sleep(SCRIMMAGE_GENERATE_INTERVAL)
