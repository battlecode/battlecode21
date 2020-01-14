import os
import logging

# Configure logging format

logging.basicConfig(format='%(asctime)s [%(threadName)-12.12s] [%(levelname)-5.5s]  %(message)s')
logging.getLogger().setLevel(logging.INFO)


# Constants, parameters and configurations

API_AUTHENTICATE = 'https://2020.battlecode.org/auth/token/'
API_USERNAME = os.getenv('BC20_DB_USERNAME')
API_PASSWORD = os.getenv('BC20_DB_PASSWORD')

API_SCRIM_LIST = 'https://2020.battlecode.org/api/match/scrimmage_list/'
API_ENQUEUE = 'https://2020.battlecode.org/api/match/enqueue/'

NUM_WORKER_THREADS = 10

TOURNAMENT_WORKER_TIMEOUT = 15

def api_match_status(gameid):
    """
    Returns the API link for obtaining the status of a scrimmage
    gameid: the ID of the game
    """
    return 'https://2020.battlecode.org/api/0/scrimmage/{}/status/'.format(gameid)
