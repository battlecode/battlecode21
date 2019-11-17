#!/bin/bash

if test -d "dist"; then
    ssh-agent bash -c "ssh-add .ssh/id_rsa && cd dist && git pull"
else
    ssh-agent bash -c "ssh-add .ssh/id_rsa && git clone git@github.com:battlecode/battlecode20-dist dist"
fi
