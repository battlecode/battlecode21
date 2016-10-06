# battlecode-playback 📼 [![CircleCI](https://circleci.com/gh/battlecode/battlecode-playback.svg?style=svg)](https://circleci.com/gh/battlecode/battlecode-playback)
Analyze battlecode match files programmatically.

## Contributing
Before you commit, you HAVE to run `npm run build` and commit the changes in the out/ directory.
This is a slightly painful fact due to typescript, sorry.

## Quick sample:
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

bc.stream('match.bc17').on('spawn', spawnEvent => {
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
