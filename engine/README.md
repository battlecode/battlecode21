# snek

This repository contains all the code for the Battlecode Python engine.

## Installation and Usage

### As a Package
To install the engine as a package, run
```
$ pip install --user .
```

(note for mac people: you may need to replace `pip` with `pip3`.)

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
[Game info] Turn 1
[Game info] Queue: {}
[Game info] Lords: [<ROBOT WHITE HQ WHITE>, <ROBOT BLACK HQ BLACK>]
[Robot WHITE HQ log] Starting Turn!
[Robot WHITE HQ log] Team: Team.WHITE
[Robot WHITE HQ log] Type: RobotType.OVERLORD
[Robot WHITE HQ log] Bytecode: 4981
[Robot WHITE HQ log] Spawned unit at: (0, 0)
[Robot WHITE HQ log] done!
[Robot WHITE HQ info] Remaining bytecode: 4955
[Robot BLACK HQ log] Starting Turn!
[Robot BLACK HQ log] Team: Team.BLACK
[Robot BLACK HQ log] Type: RobotType.OVERLORD
[Robot BLACK HQ log] Bytecode: 4981
[Robot BLACK HQ log] Spawned unit at: (7, 6)
[Robot BLACK HQ log] done!
[Robot BLACK HQ info] Remaining bytecode: 4954
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

(note: you may not need to do the above if you have already installed the `battlecode` package as per the previous instructions.)

Then, you can directly run
```
$ python3 main.py examplefuncsplayer
```

This will also the example bot in `examplefuncsplayer` against itself. If you want to run two bots against each other you can do `python3 main.py arvidplayer exampelfuncsplayer`.
