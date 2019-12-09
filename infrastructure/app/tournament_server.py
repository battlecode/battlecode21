#!/usr/bin/env python3

import util
from config import *

import logging
import requests


def generate_tournament():
    """Generates the tournament bracket and publishes it to the queue"""
    try:
        # TODO: generate tournament bracket
        util.publish_match('helloworld', 'helloworld')
    except:
        logging.critical('Error while running tournament')


if __name__ == '__main__':
    # TODO: receive tournament specifications, via sys.args or something

    logging.info('Beginning tournament')
    generate_tournament()
    logging.info('Tournament finished')
