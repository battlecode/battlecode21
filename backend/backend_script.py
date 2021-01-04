# domain = 'http://2021.battlecode.org/'
domain = 'http://localhost:8000/'

import dev_settings_sensitive
import requests
import json

data = {
  'username': 'database_admin',
  'password': dev_settings_sensitive.ADMIN_PASS
}

response = requests.post(domain + 'auth/token/', data=data)
token = json.loads(response.text)['access']

data = {
  'type': 'scrimmage',
  'tournament_id': '0',
  'player1': '1744',
  'player2': '1810',
}

headers = {"Authorization": "Bearer " + token}

response = requests.post(domain + 'api/match/enqueue/', data=data, headers=headers)

print(response.text)
