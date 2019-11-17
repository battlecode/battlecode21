#!/bin/bash

chmod 600 .ssh/id_rsa
ssh-keyscan github.com > githubKey
ssh-keygen -lf githubKey | grep "SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8"
mkdir -p ~/.ssh
cat githubKey >> ~/.ssh/known_hosts
rm githubKey
