# snek

This repository contains all the code for the Battlecode Python engine.

## Installation and Usage

### As a Package
To install the engine as a package, run
```
$ pip install --user .
```

This will allow you to import battlecode as a package. Test it out by trying:

```
$ python3
>>> import battlecode
>>> code = battlecode.CodeContainer.from_directory('./examplefuncsplayer')
>>> game = battlecode.Game([code, code], debug=True)
>>> game.turn()
```

You should see the output:
```
[Game info] Turn 0
[Game info] Queue: {}
[Game info] Lords: [<ROBOT WHITE HQ WHITE>, <ROBOT BLACK HQ BLACK>]
[Robot WHITE HQ info] Remaining bytecode: 4990
[Robot BLACK HQ info] Remaining bytecode: 4990
```

You can also try running:
```
$ python3 as-package.py
```

If you would like to uninstall, simply run
```
$ pip uninstall battlecode
```

### Running directly
Make sure to install the required packages (RestrictedPython) by running

```
$ pip install --user -r requirements.txt
```
Then, you can directly run
```
$ python3 main.py
```

This will also run the example bot in `examplefuncsplayer`. If you would like to run a different bot, simply change `examplefuncsplayer` to a different directory.
