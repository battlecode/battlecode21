from RestrictedPython import compile_restricted, safe_builtins
import threader
import threading
import sys
from time import sleep

class RobotThread(threading.Thread):
    def __init__(self, robot):
        threading.Thread.__init__(self)
        self.stopped = False
        self.robot = robot

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

class RobotRunner():
    STARTING_BYTECODE = 10000
    EXTRA_BYTECODE    = 5000
    
    def __init__(self, bytecode, game_methods):
        self.bytecode = bytecode

        self.globals = {
            '__builtins__': safe_builtins,
            '__name__':'__main__'
        }

        self.game_methods = game_methods

        self.globals['__builtins__']['__metaclass__'] = type
        self.globals['__builtins__']['__import__'] = self.import_call
        self.globals['__builtins__']['__instrument__'] = self.instrument_call

        for key, value in self.game_methods.items():
            self.globals['__builtins__'][key] = value

        self.locals = {}
        self.bytecode_counter = self.STARTING_BYTECODE

        self.initialized = False
        self.kill_me = False

    def instrument_call(self):
        if self.bytecode_counter == 0:
            self.game_methods['robot_error'](RuntimeError('Ran out of bytecode.'))
            self.kill_me = True
            while True:
                sleep(0.1)
        
        self.bytecode_counter -= 1



    def import_call(self, name, globals=None, locals=None, fromlist=(), level=0):
        if not isinstance(name, str) or not (isinstance(fromlist, tuple) or fromlist is None):
            raise ImportError('Invalid import.')

        if name == '':
            # This should be easy to add, but it's work.
            raise ImportError('No relative imports (yet).')

        if not name in self.bytecode:
            raise ImportError('Module "' + name + '" does not exist.')

        run_globals = {
            '__builtins__':self.globals['__builtins__'],
            '__name__':name
        }

        exec(self.bytecode[name], run_globals)
        new_module = type(sys)(name)
        new_module.__dict__.update(run_globals)

        return new_module

    def init_robot(self):
        self.initialized = True

        try:
            exec(self.bytecode['robot'], self.globals, self.locals)
        except Exception:
            self.game_methods['robot_error'](sys.exc_info())

    def do_turn(self):
        self.bytecode_counter += self.EXTRA_BYTECODE
        
        if 'turn' in self.locals:
            try:
                self.locals['turn']()
            except Exception:
                self.game_methods['robot_error'](sys.exc_info())

        else:
            self.game_methods['robot_error'](RuntimeError('Couldn\'t find robot variable.'))

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
