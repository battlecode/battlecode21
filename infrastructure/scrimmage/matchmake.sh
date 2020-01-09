#!/bin/sh

scriptPath=$(dirname "$(readlink -f "$0")")
source "${scriptPath}/.env.sh"

token=$( /usr/bin/curl -sX POST \
    https://2020.battlecode.org/auth/token/ \
    -d username=${BC20_DB_USERNAME} \
    -d password=${BC20_DB_PASSWORD} \
  | /usr/bin/jq -r ".access" )

/usr/bin/curl -vX GET \
    https://2020.battlecode.org/api/match/generate_matches/ \
    --oauth2-bearer ${token}
