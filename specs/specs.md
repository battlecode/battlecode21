# A Prance of Pawns

_The formal specification of the Battlehack 2020 game._
Current version: 1.0.1

You are one of the noble houses, manipulating your pawns around Westeros.

# Game Overview

The game takes place on an $N$ by $N$ chess board ($N = 16$), and the only pieces available are pawns.
Every round, each pawn on the board will get to take a turn, and then each player may spawn one pawn on their back row.
The objective of the game is to get $N/2$ of your pawns to your opponent’s back row before they do the same to you.

# Game Mechanics

Each robot in the game (pawn or Overlord) runs a completely distinct copy of your code, and they may not communicate with each other.
Robots have to decide what to do ONLY based on what they can see on the board, so you must find a way to implement your strategy as a collection of independent actions from your pawns.

If no one has won (gotten $N/2$ pawns to the opponent’s back row) after 250 rounds, the game ends and ties are broken by:
1. Number of pawns on opponent’s back row
2. Coin flip

At any point, all robots can get their type (`RobotType.PAWN` or `RobotType.OVERLORD`) with `get_type()`, their team with `get_team()`, and the board size with `get_board_size()`.

## Turns

Each round is broken down into sequential turns, one for each pawn.
In the order they were spawned, each pawn may sense its surroundings and then optionally make a move.
Once all pawns have taken their turn, each Overlord (an omniscient robot not on the board) may spawn one pawn on their team’s back row (with `spawn(row, col)`).

## Sensing

Pawns may only see tiles around them within a box of size 5x5 (centered at their position), in particular the other pawns on those tiles (of both teams).
Pawns can use `get_location()` to get their current location.
Both pawns and the Overlord can use `check_space(row, col)`, and if that space is within their vision radius it will return `Team.WHITE` or `Team.BLACK` if there is a robot occupying the square, or `False` if the square is empty.

They must decide how to act based only on that information.

The Overlord can sense the entire board using `get_board()`, which returns the current state of the board as an array of `Team.WHITE`, `Team.BLACK`, and `None`, representing white-occupied, black-occupied, and empty squares, respectively. The Overlord should leverage this omniscience to spawn new pawns intelligently.

## Movement

Each pawn gets one action per turn. On a turn, it may do exactly one of:
- move forward one square, with `move_forward()`
- move diagonally one square onto an enemy pawn, capturing that enemy pawn and removing it from the game, with `capture(row, col)`
- pass and do nothing

# Bytecode Limits

Robots are also very limited in the amount of computation they are allowed to perform per **turn**.
**Bytecodes** are a convenient measure of computation in languages like Python,
where one bytecode corresponds roughly to one operation,
and a single line of code generally contains several bytecodes.
Because bytecodes are a feature of the compiled code itself, the same program will always compile to the same bytecodes and thus take the same amount of computation on the same inputs.
This is great, because it allows us to avoid using _time_ as a measure of computation, which leads to problems such as nondeterminism.
With bytecode cutoffs, re-running the same match between the same bots produces exactly the same results--a feature you will find very useful for debugging.

Every round each robot sequentially takes its turn.
If a robot attempts to exceed its bytecode limit (usually unexpectedly, if you have too big of a loop or something),
its computation will be paused and then resumed at exactly that point next turn.
The code will resume running just fine, but this can cause problems if, for example, you check if a tile is empty, then the robot is cut off and the others take their turns, and then you attempt to move into a now-occupied tile.
Instead, simply return from the `turn()` function to end your turn.
This will pause computation where you choose, and resume on the next line next turn.

The per-turn bytecode limits for various robots are as follows:
- Overlord: 20000 per turn
- Pawn: 20000 per turn

Robots can get their current bytecode with `get_bytecode()`. This is the amount of bytecode the robots have remaining for the turn.


# API Reference

Below is a quick reference of all methods available to robots. Make sure not to define your own functions with the same name as an API method, since that would overwrite the API method.

To view the implementation of these methods and the full list of what's available, check out [battlehack20/engine/game/game.py](https://github.com/battlecode/battlehack20/blob/master/engine/battlehack20/engine/game/game.py#L124).

#### Type-agnostic methods

- `get_board_size()`: returns the board size
- `get_bytecode()`: returns the number of bytecodes left
- `get_team()`: returns the robot's team, either `Team.WHITE` or `Team.BLACK`
- `get_type()`: returns the robot's type, either `RobotType.OVERLORD` or `RobotType.PAWN`
- `check_space(row, col)`: returns `False` if there is no robot at the location, the team of the robot if there is one there, and throws a `RobotError` if outside the vision range

#### Overlord methods

- `get_board()`: returns the current state of the board as an array of Team.WHITE, Team.BLACK, and None, representing white-occupied, black-occupied, and empty squares, respectively
- `spawn(row, col)`: spawns a pawn at the given location, but throws a `RobotError` if the pawn is not spawned at the edge on your side of the board, or if you have already spawned a pawn in this turn

#### Pawn methods

- `capture(row, col)`: captures an enemy piece at the given location, but throws a `RobotError` if the there is not an enemy pawn there or if the location is not diagonally in front of you
- `get_location()`: returns a `(row, col)` tuple of the robot's location
- `move_forward()`: moves forward one step, but throws a `RobotError` if you have already moved, if the location is outside the board or if there is another pawn in front of you
- `sense()`: returns a list of tuples of the form `(row, col, robot.team)` visible to this robot (excluding yourself), that is, if `max(|robot.x - other.x|, |robot.y - other.y|) <= 2`


# Known Limitations and Bugs

The Battlecode Python engine is a work in progress. Please report any weird behavior or bugs by submitting an issue in the [battlehack20 repo](https://github.com/battlecode/battlehack20/issues).

We also have a [Google Doc](https://docs.google.com/document/d/10Id1pa7txfkrFgaM7WrK90VQKdbCXlNDOUuMRx7x9ls/edit) where we will keep an updated list of known bugs.

If you are able to escape the sandbox and get into our servers, please send us an email at [battlecode@mit.edu](mailto:battlecode@mit.edu) — do not post it publicly on GitHub.


# Changelog

- 1.0.1 (4/17/20)
    - spec changes: none
    - engine changes: none
- 1.0.0 (4/17/20)
    - spec changes: none
    - engine changes: none
