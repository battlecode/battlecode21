#!/bin/bash
if  test -d "dist"; then
    cd dist
    git pull "ext::ssh -i ../.ssh/id_rsa git@github.com %%S battlecode/battlecode20-dist"
else
    git clone "ext::ssh -i .ssh/id_rsa git@github.com %%S battlecode/battlecode20-dist" dist
fi