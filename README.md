# Battlehack SP20

♛

## Repository Structure

- `/backend`: Backend API in Django Rest Framework
- `/frontend`: Frontend dashboard in React
- `/engine`: Game engine in PYTHON
- `/specs`: Game specs in Markdown (and HTML generation)

## Development

### Website

To get set up, make sure you have [Node](https://nodejs.org/en/download/) and [Docker](https://docs.docker.com/docker-for-mac/install/) installed. For Windows, you will need Docker Toolbox. If you have Windows, I'd also recommend installing [Cygwin](https://www.cygwin.com/), since we have some bash scripts that won't work with the standard Windows command prompt. (Docker is not strictly necessary, but it makes stuff easier, especially if you want to work on the backend of the website.)

Go to the `frontend` folder and run `npm install`.

Then, you can start the frontend by running `npm run start` in the `frontend` folder. (If this fails on Windows, make sure you are using Cygwin.) After this step, you should be able to view the website at http://localhost:3000.

If you also want to run the backend (which will enable things like signing in to the website, and a rankings table, etc) then run `docker-compose -f docker-compose-b.yml up --build` in this folder. If you don't have Docker, you can try following the instructions in the `/backend` folder instead.

You can also run both the backend and the frontend in a Docker container, by running `docker-compose up --build`, but that might be slower.

### Engine

See the `engine` folder for documentation!

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
