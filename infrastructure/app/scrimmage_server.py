#!/usr/bin/env python3

import util
from config import *

import logging
import time
import requests


def generate_scrimmages():
    """Generates scrimmages and publishes them to the queue"""
    try:
        # TODO: generate scrimmages
        util.publish_match('helloworld', 'helloworld')
    except:
        logging.critical('Error while generating scrimmages')


if __name__ == '__main__':
    while True:
        logging.info('Beginning match making')
        generate_scrimmages()
        logging.info('Match making finished, sleeping for {} seconds'.format(SCRIMMAGE_GENERATE_INTERVAL))
        time.sleep(SCRIMMAGE_GENERATE_INTERVAL)
