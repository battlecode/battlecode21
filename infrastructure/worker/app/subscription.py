#!/usr/bin/env python3

from config import *

import multiprocessing, threading, logging, time, signal
from google.cloud import pubsub_v1


shutdown_requested = False # Whether this program should shut down due to SIGINT/SIGTERM

def subscribe(subscription_name, worker, give_up=False):
    """Receives and spawns threads to handle jobs received in Pub/Sub"""
    global shutdown_requested

    message = None # The current active message

    client = pubsub_v1.SubscriberClient()
    subscription_path = client.subscription_path(GCLOUD_PROJECT_ID, subscription_name)

    def renew_deadline():
        """Repeatedly give the active message more time to be processed to prevent it being resent"""
        while not (message == None and shutdown_requested):
            if message != None:
                try:
                    client.modify_ack_deadline(subscription_path, [message.ack_id], ack_deadline_seconds=SUB_ACK_DEADLINE)
                    logging.debug('Reset ack deadline for {} for {}s'.format(message.message.data.decode(), SUB_ACK_DEADLINE))
                    time.sleep(SUB_SLEEP_TIME)
                except Exception as e:
                    logging.warning('Could not reset ack deadline', exc_info=e)
    watcher = threading.Thread(target=renew_deadline)
    watcher.start()

    # Repeatedly check for new jobs until SIGINT/SIGTERM received
    logging.info('Listening for jobs')
    try:
        while not shutdown_requested:
            response = client.pull(subscription_path, max_messages=1, return_immediately=True)

            if not response.received_messages:
                logging.info('Job queue is empty')
                time.sleep(SUB_SLEEP_TIME)
                continue

            if len(response.received_messages) > 1:
                logging.warning('Received more than one job when only one expected')

            message = response.received_messages[0]

            logging.info('Beginning: {}'.format(message.message.data.decode()))
            process = multiprocessing.Process(target=worker, args=(message.message.data.decode(),))
            process.start()
            process.join()

            if process.exitcode == 0:
                # Success; acknowledge and return
                try:
                    client.acknowledge(subscription_path, [message.ack_id])
                    logging.info('Ending and acknowledged: {}'.format(message.message.data.decode()))
                except Exception as e:
                    logging.error('Could not end and acknowledge: {}'.format(message.message.data.decode()), exc_info=e)
            elif give_up and (int(time.time()) - message.message.publish_time.seconds) > 600:
                # Failure; give up and acknowledge
                try:
                    client.acknowledge(subscription_path, [message.ack_id])
                    logging.error('Failed but acknowledged: {}'.format(message.message.data.decode()))
                except Exception as e:
                    logging.error('Failed but could not acknowledge: {}'.format(message.message.data.decode()), exc_info=e)
            else:
                # Failure; refuse to acknowledge
                logging.error('Failed, not acknowledged: {}'.format(message.message.data.decode()))

            # Stop extending this message's deadline in the "watcher" thread
            message = None
    except Exception as e:
        logging.critical('Exception encountered. ', exc_info=e)
    finally:
        # If there is an exception, make sure the "watcher" thread shuts down
        shutdown_requested = True

def graceful_exit(signal, frame):
    global shutdown_requested
    shutdown_requested = True
    logging.warning('Requesting shutdown due to signal {}'.format(signal))

signal.signal(signal.SIGINT, graceful_exit)
signal.signal(signal.SIGTERM, graceful_exit)
