# A Prance of Pawns

_The formal specification of the Battlehack SP20 game._
Current version: 2020.2.0.3

You are one of the noble houses, manipulating your pawns around Westeros.

# Game Overview

The game takes place on an $N$ by $N$ chess board ($8 \le N \le 32$), and the only pieces available are pawns.
Every round, each pawn on the board will get to take a turn, and then each player may spawn one pawn on their back row.
The objective of the game is to get $N/2$ of your pawns to your opponent’s back row before they do the same to you.

# Game Mechanics

Each robot in the game (pawn or Overlord) runs a completely distinct copy of your code, and they may not communicate with each other.
Robots have to decide what to do ONLY based on what they can see on the board, so you must find a way to implement your strategy as a collection of independent actions from your pawns.

If no one has won (gotten $N/2$ pawns to the opponent’s back row) after 50 rounds, the game ends and ties are broken by:
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
- Overlord: 10000 on first turn, 5000 per turn after
- Pawn: 10000 on first turn, 5000 per turn after

Robots can get their current bytecode with `get_bytecode()`. This is the amount of bytecode the robots have remaining for the thurn.


# Changelog
