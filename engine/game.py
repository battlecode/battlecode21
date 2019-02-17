import random
from runner import RobotRunner
import json

# Very simple test game.
# Robots can move or attack.
# Is played on an infinite map.

RED = 0
BLUE = 1

class Robot:
	STARTING_HEALTH = 100

	def __init__(self, x, y, team):
		self.id = random.randint(0,2**12)

		self.x = x
		self.y = y

		self.health = Robot.STARTING_HEALTH
		self.logs = []

		self.team = team

	def animate(self, code, methods, debug=False):
		self.runner = RobotRunner(code, methods, self.log, self.error, debug=debug)
		self.debug = debug

	def log(self, msg):
		if not isinstance(msg, str):
			raise RuntimeError('Can only log strings.')

		self.logs.append({'type':'log','msg':msg})
		
		if self.debug:
			print('[Robot ' + str(self.id) + ' log]', msg)

	def error(self, msg):
		if not isinstance(msg, str):
			raise RuntimeError('Can only error strings.')

		self.logs.append({'type':'error','msg':msg})

		if self.debug:
			print('[Robot ' + str(self.id) + ' error]', msg)

	def turn(self):
		self.logs.clear()
		self.runner.run()

class Game:
	MAX_ROUNDS = 100

	def __init__(self, code, debug=False):
		self.code = code

		self.debug = debug
		self.running = True
		self.winner = None

		self.queue = []
		self.robin = 0
		self.round = 0

		self.board = [[None]*20 for _ in range(20)]

		for i in range(20):
			for j in range(5):
				self.new_robot(j, i, RED)
				self.new_robot(19-j, i, BLUE)

	def turn(self):
		robot = self.queue[self.robin]

		robot.turn()

		if not robot.runner.initialized:
			self.delete_robot(robot)

		self.robin += 1
		if self.robin >= len(self.queue):
			self.robin = 0
			self.round += 1

		self.check_over()

	def delete_robot(self, robot):
		pos = self.queue.index(robot)

		self.board[robot.y][robot.x] = None
		del self.queue[pos]
		
		if self.robin >= pos:
			self.robin -= 1

	def serialize(self):
		def serialize_robot(robot):
			if robot is None:
				return None

			return {'id':robot.id, 'team':robot.team, 'health':robot.health, 'logs':robot.logs[:]}

		return [[serialize_robot(c) for c in r] for r in self.board]

	def check_over(self):
		teams = [0,0]
		for robot in self.queue:
			teams[robot.team] += robot.health

		if teams[0] == teams[1] and (teams[0] == 0 or self.round == Game.MAX_ROUNDS):
			self.running = False
			self.winner = random.choice([0,1])

		elif teams[0] == 0:
			self.running = False
			self.winner = 1

		elif teams[1] == 0:
			self.running = False
			self.winner = 0

		elif self.round == Game.MAX_ROUNDS:
			self.running = False
			self.winner = 0 if teams[0] > teams[1] else 1

	def new_robot(self, x, y, team):
		robot = Robot(x, y, team)

		robot.animate(self.code[team], {
			'move': lambda dx, dy: self.robot_move(robot, dx, dy),
			'attack': lambda dx, dy: self.robot_attack(robot, dx, dy),
			'view': lambda: self.robot_view(robot)
		}, debug=self.debug)
		
		self.queue.append(robot)
		self.board[y][x] = robot

	def robot_move(self, robot, dx, dy):
		pass
	
	def robot_attack(self, dx, dy):
		pass
	
	def robot_view(self, dx, dy):
		pass
