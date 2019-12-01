# Battlecode 2020

🍜

## Repository Structure

- `/backend`: Backend API in Django Rest Framework
- `/frontend`: Frontend dashboard in React
- `/engine`: Game engine in Java
- `/schema`: Game serialization schema (basically, an encoding of all units and events in a game)
- `/client`: Game client (visualizer and playback) in TypeScript
- `/example-bots`: A bunch of example bots for the game!

## Development

### Website

To get set up, make sure you have [Node](https://nodejs.org/en/download/) and [Docker](https://docs.docker.com/docker-for-mac/install/) installed. For Windows, you will need Docker Toolbox. If you have Windows, I'd also recommend installing [Cygwin](https://www.cygwin.com/), since we have some bash scripts that won't work with the standard Windows command prompt. (Docker is not strictly necessary, but it makes stuff easier, especially if you want to work on the backend of the website.)

First, install all required packages: run `npm install` in each of the four folders `/schema`, `/client/playback`, `/client/visualizer`, `/frontend`.

Then, you can start the frontend by running `npm run start` in the `/frontend` folder. (If this fails on Windows, make sure you are using Cygwin.) After this step, you should be able to view the website at http://localhost:3000.

If you also want to run the backend (which will enable things like signing in to the website, and a rankings table, etc) then run `docker-compose -f docker-compose-b.yml up --build` in this folder. If you don't have Docker, you can try following the instructions in the `/backend` folder instead.

You can also run both the backend and the frontend in a Docker container, by running `docker-compose up --build`, but that might be slower.

### Engine

(whenever Gradle has problems with something, run `gradle clean` and see if it helps)

To run a game, run

```
gradle headless <-PteamA=(...)> <-PteamB=(...)> <-Pmaps=(...)>
```

(where `gradle` can be substituted for `./gradlew` on Mac/Linux and `gradlew` on Windows). Note that you can run `gradle headless` only if you just want to run an example game. The replay file will be in `/matches`. Use `headlessX` for bots that are in `battlecode20-internal-test-bots`.

### Client

First run `npm install` in the `schema` folder, followed by `npm run install_all` in the `client` folder. You can then run

```
npm run watch
```

which will launch the client on http://localhost:8080 (if available).

### Docs

You can generate javadocs as follows:

```
gradle release_docs_zip -Prelease_version=2020.0.0.0.0.1
```

This will create a `zip` file. Unzip and open the `index.html` file in it to view the docs. In particular, looking at the documentation for `RobotController` will be helpful.

## Notes for porting this to battlecode21

When Battlecode 2021 comes around, it will probably useful to reuse a fair amount of this codebase. Mainting git history is nice, but not trivial. The following steps were taken to port `battlecode19` to this repo and maintain history (assuming we start in this repo):

```
cd ..
git clone https://github.com/battlecode/battlecode19
cd battlecode19
git checkout -b battlecode20export
git filter-branch --prune-empty --index-filter 'var=$(git ls-files | grep -v "^api\|^app") && test "$var" && git rm $var --cached'
cd ..
cd battlecode20
git pull ../battlecode19 --allow-unrelated-histories
mv api backend
mv app frontend
```

This procedure keeps the history nicely.
