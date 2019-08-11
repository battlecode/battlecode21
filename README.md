# Battlecode 2020

🐢

## Repository Structure

- `/backend`: Backend API in Django Rest Framework
- `/frontend`: Frontend dashboard in React
- `/engine`: Game engine
- `/visualizer`: Game visualizer

## Development

### Website

To run the website locally, run

```
docker-compose up --build
```

in this directory, and go to http://localhost:3000. This will create containers for the frontend, backend and the database. The frontend and backend directories are mounted in the respective containers, so code updates should be automatically reflected, without needing to restart. The first time, this might take quite some time. If node packages are frequently updated, it might be more convenient to run the frontend outside of Docker.

You can also run `docker-compose -f docker-compose-b.yml up --build` to run the backend only, and then run the frontend separately, which might be the best way to go about things.

If you want to run each of the different components separately, natively, then first start the backend by following the instructions in `/backend`, and then start the frontend by following the instructions in `/frontend`. The website should then be reachable at http://localhost:3000.

### Engine

To be updated.

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
