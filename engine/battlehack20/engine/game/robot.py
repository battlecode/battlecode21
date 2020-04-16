from ..container.runner import RobotRunner
from .robottype import RobotType

class Robot:
    STARTING_HEALTH = 1

    def __init__(self, row, col, team, id, type=RobotType.PAWN):
        self.id = id
        self.type = type

        self.row = row
        self.col = col
        self.has_moved = False

        self.health = Robot.STARTING_HEALTH
        self.logs = []

        self.team = team

        self.runner = None
        self.debug = False

    def animate(self, code, methods, debug=False):
        self.runner = RobotRunner(code, methods, self.log, self.error, debug=debug)
        self.debug = debug

    def kill(self):
        self.runner.kill()

    def log(self, msg):
        if not isinstance(msg, str):
            raise RuntimeError('Can only log strings.')

        self.logs.append({'type': 'log', 'msg': msg})

        if self.debug:
            if self.type == RobotType.OVERLORD:
                print(f'[Robot {self.id} log]', msg)
            else:
                team = 'BLACK' if self.team.value else 'WHITE'
                print(f'[Robot {self.id} {team} log]', msg)

    def error(self, msg):
        if not isinstance(msg, str):
            raise RuntimeError('Can only error strings.')

        self.logs.append({'type': 'error', 'msg': msg})

        if self.debug:
            if self.type == RobotType.OVERLORD:
                print(f'\u001b[31m[Robot {self.id} error]\u001b[0m', msg)
            else:
                team = 'BLACK' if self.team.value else 'WHITE'
                print(f'\u001b[31m[Robot {self.id} {team} error]\u001b[0m', msg)

    def turn(self):
        self.logs.clear()
        self.has_moved = False

        self.runner.run()

    def __str__(self):
        team = 'B' if self.team.value else 'W'
        return '%s%3d' % (team, self.id)

    def __repr__(self):
        team = 'BLACK' if self.team.value else 'WHITE'
        return f'<ROBOT {self.id} {team}>'
