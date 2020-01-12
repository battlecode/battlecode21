from config import *

import requests

def get_api_auth_token():
    """Retrieves an API token for sending authenticated requests to the backend server"""
    try:
        response = requests.post(url=API_AUTHENTICATE, data={
            'username': API_USERNAME,
            'password': API_PASSWORD
        })
        response.raise_for_status()
        return response.json()['access']
    except:
        logging.error('Could not obtain API authentication token')

def enqueue(match_params):
    """Enqueues a match"""
    try:
        auth_token = get_api_auth_token()
        response = requests.post(url=API_ENQUEUE, data=match_params, headers={
            'Authorization': 'Bearer {}'.format(auth_token)
        })
        response.raise_for_status()
    except:
        logging.error('Could not enqueue match: {}'.format(match_params))
