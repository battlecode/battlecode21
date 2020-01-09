#!/bin/sh

# Credit to https://roboslang.blog/post/2017-12-06-cron-docker/

scriptPath=$(dirname "$(readlink -f "$0")")

printenv | sed 's/^\(.*\)$/export \1/g' > ${scriptPath}/.env.sh
chmod +x ${scriptPath}/.env.sh

crond -f
