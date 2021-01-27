# HOW TO RELEASE A JAVA GAME

## Prereqs

a bash-like shell (windows command prompt won't work for this). Also, zsh (and perhaps other shell environments) don't work to run the frontend deploy script. bash seems to work.

npm

a git key: Obtain a git key that has "publish packages" permissions. This key is a string. Keep it around somewhere

## Get updates

Make sure you have all the most recent updates to the repo! (Ideally they're pushed to git. Then do git checkout master, git fetch, git pull.)

## Update some version numbers

`client/visualizer/src/config` -- find ``gameVersion`, and update that.

`gradle.properties` -- update `release_version`.

Make sure these updates are pushed to master!

## Update specs and javadoc

In our game spec (specs folder), make sure changes are up to date.

Pay attention to the version number at the top of specs.md.html, and to the changelog at the bottom.

push to master btw!

## Release packages

Set BC21_GITUSERNAME: `export BC21_GITUSERNAME=n8kim1`, etc

Set BC21_GITKEY similarly. This git key is the string discussed above.

./gradlew publish

Now set version.txt in gcloud (also set cache policy to no-store)

## Deploy frontend

Run the deploy.sh script! For arguments, follow the instructions in the file. For example: `bash ./deploy.sh deploy 2021.3.0.2`
