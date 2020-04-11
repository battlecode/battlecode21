# snek

This repository contains all the code for the Battlecode Python engine.

## Installation and Usage

### Installation
To install the engine as a local package, run
```
$ pip install --user -e .
```

(Note for mac people: you may need to replace `pip` with `pip3`.) 

The `-e` flag allows you to change the source code and have the changes be automatically reflected without needing to reinstall.

Test it out by trying:

```
$ python3 run.py examplefuncsplayer examplefuncsplayer
```

You should see a game between `examplefuncsplayer` and `examplefuncsplayer` being played.
If your code is in a directory `~/yourcode/coolplayer` then you can run it against examplefuncsplayer using

```
$ python3 run.py examplefuncsplayer ~/yourcode/coolplayer
```

If you would like to uninstall, simply run
```
$ pip uninstall battlehack20
```

### Running Interactively

Run

```
$ python3 -i run.py examplefuncsplayer examplefuncsplayer
```

This will open an interactive Python shell. There, you can run

```
>>> step()
```

which advances the game 1 turn. This is very useful for debugging.


### Advanced Usage

Interacting directly with the `battlehack20` API will give you more freedom and might make it easier to debug your code. The following is a minimal example of how to do that.

```
$ python3
>>> import battlehack20 as bh20
>>> code = bh20.CodeContainer.from_directory('./examplefuncsplayer')
>>> game = bh20.Game([code, code], debug=True)
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

If you're curious, this is how the `run.py` script works. Study the source code of `run.py` to figure out how to set up a viewer.
