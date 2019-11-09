import os
import logging, multiprocessing

# Configure logging format

multiprocessing.log_to_stderr()
multiprocessing.get_logger().handlers[0].setFormatter(logging.Formatter(
    '%(asctime)s [%(threadName)-12.12s] [%(levelname)-5.5s]  %(message)s'))
logging.getLogger().addHandler(multiprocessing.get_logger().handlers[0])
logging.getLogger().setLevel(logging.INFO)


# Constants, parameters and configurations

GCLOUD_PROJECT_ID       = 'battlecode18'
GCLOUD_SUB_COMPILE_NAME = 'bc20-compile-sub'
GCLOUD_SUB_GAME_NAME    = 'bc20-game-sub'
GCLOUD_BUCKET_ID        = 'bc20-submissions'

PUBSUB_ACK_DEADLINE = 30 # Value to which ack deadline is reset
PUBSUB_SLEEP_TIME   = 10 # Interval between checks for new jobs and ack deadline

TIMEOUT_UNZIP   = 30   # Maximum execution time for unzipping submission archive
TIMEOUT_PULL    = 30   # Maximum execution time for updating distribution
TIMEOUT_COMPILE = 90   # Maximum execution time for submission compilation
TIMEOUT_GAME    = 3600 # Maximum execution time for game running

PATH_DIST   = '/app/bc20-dist'
PATH_ENGINE = os.path.join(PATH_DIST, 'engine.jar')


# Compilation API specifications

COMPILE_SUCCESS = 1
COMPILE_FAILED  = 2
COMPILE_ERROR   = 3
def api_compile_update(submissionid):
    """
    Returns the API link for reporting the compilation status
    submissionid: the ID of the submission
    """
    return 'http://2020.battlecode.org/api/0/submission/{}/compilation_update/'.format(submissionid)

# Game running API specifications

def api_game_update(gametype, gameid):
    """
    Returns the API link for reporting the compilation status
    gametype: "scrimmage" or "tournament"
    gameid: the ID of the game
    """
    return 'http://2020.battlecode.org/api/0/{}/{}/set_outcome/'.format(gametype, gameid)
