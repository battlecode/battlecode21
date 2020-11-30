# Battlecode Playback 📼

## Overview
  Analyze battlecode match files programmatically.
  This is written in Typescript and imports `battlecode-schema` in `/schema`. Visualizer in `../visualizer` will import this `battlecode-playback` package.


## Contributing
Before you commit, **please run** `npm run build` and commit the changes in the out/ directory. 
This is a slightly painful fact due to typescript, sorry.


### NPM Scripts
Remember to run `npm install` without any serious errors in this directory.

 * `npm run build`: Compile typescript files (`src/*.ts`) into javascript & typescript declaration files. (`out/*.js`, `out/*.d.ts`)
 * `npm run gen`: Generate dummy bc20 files. It runs typescript without transcripting into javascript, by using `ts-node`. (`../examples`)
 * `npm run clean`: Simply remove itself and everything in `out` directory.
 * `npm run watch`: Watch for chanages on `src/*.ts` files, and build again whenever change is detected.

The other scripts are under maintenance.


### Structure
  * `src/*.ts` : main source files. `index.ts` is the starting point
  * `src/tsconfig.json` : TypeScript compile option configuration file
  * `src/gen/create.ts` : code for generating dummy bc20 files.
  * `src/legacy/**/*.ts` : Legacy codes, including test for soa.ts and simulating
  * `out/*.js` : compiled javascript output of typescript files
  * `out/*.d.ts` : compiled typescript declaration files of typescript files
  * `out/files/*.bc20` : generated `bc20` files from `src/gen/*`

  
### Note
  * There is `--declaration` option in `tsconfig.json`, and therefore declaration files (`*.d.ts` files) are also generated.
  * You can try to lint this code `npm run lint`. However, I never tried it, so I don't recommend it yet.
  * The `analyze.js` below will be in source soon.
  * Commented lines are mostly explanations and legacies. Try to leave legacies somehow, so that it can be used later. (Searching commit list might be a bad idea)
  * You can edit `main` function in `src/gen/create.ts` to customize dummy files.
  * In `src/gen/create.ts`, variables with prefix `bb_` means it's flatbuffers offset value.

---

### Quick sample (legacy):
Install [node](nodejs.org).

```sh
$ npm init
$ npm i --save battlecode-playback
$ $EDITOR analyze.js
```

`analyze.js`:

```js
const bc = require('battlecode-playback');

let aliveRobots = {};
let lifetimes = [];

bc.stream('match.bc20').on('spawn', spawnEvent => {
  aliveRobots[spawnEvent.bodyId] = {
    born: spawnEvent.round
  };
}).on('death', deathEvent => {
  let lifetime = death.round - aliveRobots[deathEvent.bodyId].born;
  delete aliveRobots[deathEvent.bodyId];
}).on('close', () => {
  console.log('Average robot life length: ' +
    (lifetimes.reduce((a,b) => a+b, 0) / lifetimes.length));
});
```
