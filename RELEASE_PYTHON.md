# HOW TO RELEASE A PYTHON GAME

### Preliminaries
(in general this may be out of date; if the java guide is newer, read that instead)
- Install the frontend using `npm install`.
    - Make sure that if you run `npm run start` in the `frontend` folder, you get a working frontend on `localhost:3000` after a few minutes.
- Install `pandoc` (e.g. using Homebrew)
TODO actually you prob want to not do this. see what java game release does for spec
- Use a bash shell (or something similar — e.g. zsh but not Windows Command Prompt).

### Release Procedure
- Make sure everything is up to date:
    - `git pull`
- Choose a version as $major.$minor.$patch (e.g. 1.32.2)
- Run `./release.py $version`.
- Go on Discord and wait for things to catch on fire
