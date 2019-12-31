import os
import logging, multiprocessing

# Configure logging format

multiprocessing.log_to_stderr()
multiprocessing.get_logger().handlers[0].setFormatter(logging.Formatter(
    '%(asctime)s [%(threadName)-12.12s] [%(levelname)-5.5s]  %(message)s'))
logging.getLogger().addHandler(multiprocessing.get_logger().handlers[0])
logging.getLogger().setLevel(logging.INFO)


# Constants, parameters and configurations

TOURNAMENT_SLEEP_TIME = 15 # Interval between checks on tournament match statuses

API_AUTHENTICATE = 'https://2020.battlecode.org/auth/token/'
API_USERNAME = os.getenv('BC20_DB_USERNAME')
API_PASSWORD = os.getenv('BC20_DB_PASSWORD')

API_SCRIMMAGE_ENQUEUE = '???'
API_SCRIMMAGE_MATCHMAKE = '???'
FILE_TEAMNAMES = 'team_names'
