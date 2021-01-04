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

# data = {
#   'type': 'tour_scrimmage',
#   'tournament_id': '-1',
#   'player1': '917',
#   'player2': '919'
# }
data = {
  'status': 'error',
  'winscore': None,
  'losescore': None
}
headers = {"Authorization": "Bearer " + token}

# response = requests.post(domain + 'api/match/enqueue/', data=data, headers=headers)
response = requests.get(domain + 'api/0/scrimmage/0/test_create_scrim/', data=data, headers=headers)

print(response.text)
