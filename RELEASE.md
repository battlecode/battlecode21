# HOW TO RELEASE

### Preliminaries
- Do what README.md says:
    - Set everything up
    - Install all dependencies
- Install `pandoc` (e.g. using Homebrew)

### Release Procedure
- Make sure everything is up to date:
    - `git pull`
- Choose a version as $major.$minor.$patch (e.g. 1.32.2)
- Run `./release.py $version`.
    - It will generate a comparison link where you can view the changes since the last version.
    - It will update `specs/specs.md` with version and changelog
    - It will deploy the frontend (as soon as possible after the previous step)
      - `cd frontend`
      - `./deploy.sh deploy`
      - `cd ..`
    - `git tag $version` (but actually fill it in)
    - `git push --tags`
    - `git commit -am release 1.32.2`
- Go on Discord and wait for things to catch on fire
