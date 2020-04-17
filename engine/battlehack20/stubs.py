from typing import List, Optional, Tuple, Union

from battlehack20.engine.game.game import Team, RobotType

# The stubs in this file make it possible for editors to auto-complete the global methods
# They can be imported using "from battlehack20.stubs import *"
# This import is preprocessed away before instrumenting the code

# The dummy implementations in this file exist so that editors won't give warnings like
# "Assigning result of a function call, where the function has no return"


def log(msg: str) -> None:
    """
    Type-agnostic method.

    Logs a message.
    """
    log(msg)


def get_board_size() -> int:
    """
    Type-agnostic method.

    Returns the board size.
    """
    return get_board_size()


def get_bytecode() -> int:
    """
    Type-agnostic method.

    Returns the number of bytecodes left.
    """
    return get_bytecode()


def get_team() -> Team:
    """
    Type-agnostic method.

    Returns the robot’s team, either `Team.WHITE` or `Team.BLACK`.
    """
    return get_team()


def get_type() -> RobotType:
    """
    Type-agnostic method.

    Returns the robot’s type, either `RobotType.OVERLORD` or `RobotType.PAWN`.
    """
    return get_type()


def check_space(row: int, col: int) -> Union[Team, bool]:
    """
    Type-agnostic method.

    Returns `False` if there is no robot at the location, the team of the robot if there is one there,
    and throws a `RobotError` if outside the vision range.
    """
    return check_space(row, col)


def get_board() -> List[List[Optional[Team]]]:
    """
    Overlord method.

    Returns the current state of the board as an array of `Team.WHITE`, `Team.BLACK`, and `None`, representing
    white-occupied, black-occupied, and empty squares, respectively.
    """
    return get_board()


def spawn(row: int, col: int) -> None:
    """
    Overlord method.

    Spawns a pawn at the given location, but throws a `RobotError` if the pawn is not spawned at the edge on your
    side of the board, or if you have already spawned a pawn in this turn.
    """
    spawn(row, col)


def capture(row: int, col: int) -> None:
    """
    Pawn method.

    Captures an enemy piece at the given location, but throws a `RobotError` if the there is not an enemy pawn there
    or if the location is not diagonally in front of you.
    """
    capture(row, col)


def get_location() -> Tuple[int, int]:
    """
    Pawn method.

    Returns a `(row, col)` tuple of the robot’s location.
    """
    return get_location()


def move_forward() -> None:
    """
    Pawn method.

    Moves forward one step, but throws a `RobotError` if you have already moved, if the location is outside the board
    or if there is another pawn in front of you.
    """
    move_forward()


def sense() -> List[Tuple[int, int, Team]]:
    """
    Pawn method.

    Returns a list of tuples of the form `(row, col, robot.team)` visible to this robot (excluding yourself),
    that is, if `max(|robot.x - other.x|, |robot.y - other.y|) <= 2`.
    """
    return sense()
