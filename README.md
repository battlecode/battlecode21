# Battlehack SP20

♛

## Repository Structure

- `/backend`: Backend API in Django Rest Framework
- `/frontend`: Frontend dashboard in React
- `/engine`: Game engine in Java
- `/specs`: Game specs in Markdown (and HTML generation)

## Development

### Website

While it isn't strictly necessary, running is easier with [Docker](https://docs.docker.com/get-docker/) installed. If you have Windows, I'd also recommend installing [Cygwin](https://www.cygwin.com/), since we have some scripts and programs that won't work with the standard Windows command prompt. (Docker is not strictly necessary, but it makes stuff easier, especially the backend.)

It's easiest to run the frontend and backend individually, in a separate terminal window for each. For instructions on how to do this, see each of their directories' readmes.

You could also run both the backend and the frontend in a single Docker container, by running `docker-compose up --build`. But, it's better to run them individuallly.

### Engine

Windows users: Instead of `./gradlew`, use `gradlew` for all commands.

(whenever Gradle has problems with something, run `./gradlew clean` and see if it helps)

To run a game, run

```
./gradlew headless
```

The replay file will be in `/matches`. Use `headlessX` for bots that are in `battlecode20-internal-test-bots`. You can specify the robot code and map like this: `./gradlew headless -Pmaps=maptestsmall -PteamA=examplefuncsplayer -PteamB=examplefuncsplayer`.

## Notes for porting this to battlecode21

When Battlecode 2021 comes around, it will probably useful to reuse a fair amount of this codebase. Mainting git history is nice. Use `git-filter-repo` for this:
```
pip3 install git-filter-repo
```

Make sure you have a recent git version (run `git --version` and make sure it's compatible with git-filter-repo). The following steps were taken to port from `battlecode20` to this repo:

```
cd ..
git clone https://github.com/battlecode/battlecode20
cd battlecode20
git checkout -b battlecode20export
git filter-repo --path backend --path frontend --path infrastructure --path specs --path docker-compose-b.yml --path docker-compose.yml --path README.md --path pre_release.py --path post_release.py --tag-rename '':'bc20-'
cd ..
cd battlehack20
git pull ../battlecode20 —allow-unrelated-histories
```

Note that if you want to rename directories, that is also possible.

For the engine, the same procedure was followed, but the `filter-repo` commands were as follows instead:

```
git filter-repo --invert-paths --path-regex '(arvidplayer)|(ezouplayer)|(lectureplayer)|(testplayer)'
git filter-repo --to-subdirectory-filter engine
```
