#!/usr/bin/env python3

from config import *

import logging
import multiprocessing
import time
import signal

from google.cloud import pubsub_v1


shutdown_requested = False # Whether the process should shut down due to SIGINT/SIGTERM

def subscribe(subscription_name, worker):
    """Receives and spawns threads to handle jobs received in Pub/Sub"""

    client = pubsub_v1.SubscriberClient()
    subscription_path = client.subscription_path(GCLOUD_PROJECT_ID, subscription_name)
    logging.info('Listening for jobs')

    # Repeatedly check for new jobs until SIGINT received
    while not shutdown_requested:
        response = client.pull(subscription_path, max_messages=1, return_immediately=True)

        if not response.received_messages:
            logging.info('Job queue is empty')
            time.sleep(SUB_SLEEP_TIME)
            continue

        if len(response.received_messages) > 1:
            logging.warning('Received more than one job when only one expected')

        message = response.received_messages[0]

        process = multiprocessing.Process(target=worker, args=(message.message.data.decode(),))
        process.start()
        logging.info('Job {}: beginning'.format(message.message.data))

        while True:
            # If the process is still running, give it more time to finish
            # Reset ack deadline regularly to prevent PubSub from resending message
            if process.is_alive():
                client.modify_ack_deadline(
                    subscription_path,
                    [message.ack_id],
                    ack_deadline_seconds=SUB_ACK_DEADLINE)
                logging.debug('Reset ack deadline for {} for {}s'.format(
                    message.message.data, SUB_ACK_DEADLINE))

            # If the process is finished, acknowledge it
            else:
                client.acknowledge(subscription_path, [message.ack_id])
                logging.info('Job {}: ending and acknowledged'.format(message.message.data))
                break

            # Sleep the thread before checking again
            time.sleep(SUB_SLEEP_TIME)


def graceful_exit(signal, frame):
    global shutdown_requested
    shutdown_requested = True
    logging.warning('Requesting shutdown due to signal {}'.format(signal))

signal.signal(signal.SIGINT, graceful_exit)
signal.signal(signal.SIGTERM, graceful_exit)
