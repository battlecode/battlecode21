from RestrictedPython import compile_restricted, safe_builtins
from instrument import instrument
import threader
import threading
from time import sleep, time
import sys

class RobotThread(threading.Thread):
    def __init__(self, robot):
        threading.Thread.__init__(self)
        self.stopped = False
        self.robot = robot
        self.turn = 0

    def run(self):
        if not self.robot.initialized:
            self.robot.init_robot()
        else:
            self.robot.do_turn()
        self.stopped = True

    def is_alive(self):
        return not self.stopped

    def end(self):
        if self.is_alive():
            threader.killThread(self.ident)
            self.stopped = True


class RobotRunner(threading.Thread):
    STARTING_BYTECODE = 10000
    EXTRA_BYTECODE    = 5000
    
    def __init__(self, bytecode):
        self.bytecode = bytecode

        self.globals = {
            '__builtins__': safe_builtins,
            '__instrument__':self.instrument_call
        }

        self.globals['__builtins__']['__name__'] = '__main__'
        self.globals['__builtins__']['__metaclass__'] = type

        self.message = None

        self.locals = {}
        self.bytecode_counter = self.STARTING_BYTECODE
        self.turn = 0

        self.initialized = False
        self.kill_me = False

    def instrument_call(self):
        if self.bytecode_counter == 0:
            self.message = (None, RuntimeError('Ran out of bytecode.'))
            self.kill_me = True
            while True:
                sleep(0.1)
        
        self.bytecode_counter -= 1

    def init_robot(self):
        self.initialized = True

        error = None

        try:
            exec(self.bytecode, self.globals, self.locals)
        except Exception as e:
            error = e

        self.message = (None, error)


    def do_turn(self):
        self.bytecode_counter += self.EXTRA_BYTECODE
        
        if 'robot' in self.locals:
            error = None

            try:
                self.locals['robot'].turn()
            except Exception as e:
                error = e

            if hasattr(self.locals['robot'], 'message') and \
               isinstance(getattr(self.locals['robot'],'message',None),dict):
                self.message = (self.locals['robot'].message, error)
                self.locals['robot'].message = None

            else:
                self.message = (None, error)
        
        else:
            self.message = (None, RuntimeError('Couldn\'t find robot.'))


code = """
class Robot:
    def __init__(self):
        self.message = None
        self.x = 0

    def turn(self):
        y = 0
        for i in range(1000):
            y += i
        self.x += 1
        self.message = {'dir':self.x}

robot = Robot()
"""

bytecode = compile(code, 'robot.py', 'exec')
bytecode = instrument(bytecode)


def run_robots(robots):
    threads = [RobotThread(robot) for robot in robots]
    for thread in threads:
        thread.start()

    alive = len(threads)
    while alive > 0:
        for thread in threads:
            alive = 0
            if thread.robot.kill_me and thread.is_alive():
                thread.end()
                thread.robot.kill_me = False
            elif thread.is_alive():
                alive += 1

robots = [RobotRunner(bytecode) for _ in range(100)]
start_time = time()
run_robots(robots)
print(time() - start_time)
start_time = time()
run_robots(robots)
print(time() - start_time)


start_time = time()
for robot in robots:
    run_robots([robot])
print(time() - start_time)

print(robots[0].message)