# HOW TO RELEASE

### Preliminaries
- Install the frontend using `npm install`.
    - Make sure that if you run `npm run start` in the `frontend` folder, you get a working frontend on `localhost:3000` after a few minutes.
- Install `pandoc` (e.g. using Homebrew)
- Use a bash shell (or something similar — e.g. zsh but not Windows Command Prompt).

### Release Procedure
- Make sure everything is up to date:
    - `git pull`
- Choose a version as $major.$minor.$patch (e.g. 1.32.2)
- Run `./release.py $version`.
- Go on Discord and wait for things to catch on fire
