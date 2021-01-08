# HOW TO RELEASE A JAVA GAME

## Prereqs

a bash-like shell (windows command prompt won't work for this)

npm

a git key: Obtain a git key that has "publish packages" permissions. This key is a string. Keep it around somewhere

## Get updates

Make sure you have all the most recent updates to the repo! (Ideally they're pushed to git. Then do git checkout master, git fetch, git pull.)

## Update some version numbers

Client/visualizer/src/config or smth

gradle properties

push this to master!

## Release packages

Set BC21_GITUSERNAME: `export BC21_GITUSERNAME=n8kim1`, etc

Set BC21_GITKEY similarly

./gradlew publish

Now set version.txt in gcloud (also set cache policy to no-store)

## Update specs and javadoc

In our game spec (specs folder), make sure changes are up to date.

Pay attention to the version number at the top of specs.md.html, and to the changelog at the bottom.

push to master btw!

## Deploy frontend

Delete frontend/public/javadoc, and frontend/public/out, if they exist, in order to produce new version of them.

Produce a new javadoc folder and copy it into public. (see the top level readme)

Also build a production version of the client and copy it into public. (see some notes, somewhere)
