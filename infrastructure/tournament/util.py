from config import *

import requests, json

def get_api_auth_token():
    try:
        response = requests.post(url=API_AUTHENTICATE, data={
            'username': API_USERNAME,
            'password': API_PASSWORD
        })
        response.raise_for_status()
        return json.loads(response.text)['access']
    except:
        logging.error('Could not obtain API authentication token')
