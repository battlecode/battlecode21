from RestrictedPython import compile_restricted, safe_builtins
import threader
import threading
import sys
from time import sleep
import pdb

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
    
    def __init__(self, code, game_methods, debug=False):
        self.locals = {}
        self.globals = {
            '__builtins__': safe_builtins,
            '__name__':'__main__'
        }

        self.globals['__builtins__']['__metaclass__'] = type
        self.globals['__builtins__']['__instrument__'] = self.instrument_call
        self.globals['__builtins__']['__import__'] = self.import_call

        for key, value in game_methods.items():
            self.globals['__builtins__'][key] = value

        self.game_methods = game_methods
        self.code = code
        self.imports = {}

        self.bytecode = self.STARTING_BYTECODE

        self.initialized = False
        self.kill_me = False

        self.debug = debug

    def instrument_call(self):
        if self.bytecode == 0:
            try:
                raise RuntimeError('Ran out of bytecode.')
            except:
                self.game_methods['robot_error'](sys.exc_info())
            
            self.kill_me = True
            while True:
                sleep(0.1)
        
        self.bytecode -= 1

    def import_call(self, name, globals=None, locals=None, fromlist=(), level=0, caller='robot'):
        if not isinstance(name, str) or not (isinstance(fromlist, tuple) or fromlist is None):
            raise ImportError('Invalid import.')

        if name == '':
            # This should be easy to add, but it's work.
            raise ImportError('No relative imports (yet).')

        if not name in self.code:
            if self.debug and name == 'pdb':
                return pdb

            raise ImportError('Module "' + name + '" does not exist.')

        my_builtins = dict(self.globals['__builtins__'])
        my_builtins['__import__'] = lambda n, g, l, f, le: self.import_call(n, g, l, f, le, caller=name)
        run_globals = { '__builtins__':my_builtins, '__name__':name }

        # Loop check: keep dictionary of who imports who.  If loop, error.
        # First, we build a directed graph:
        if not caller in self.imports:
            self.imports[caller] = { name }
        else:
            self.imports[caller].add(name)

        # Next, we search for cycles.
        path = set()
        def visit(vertex):
            path.add(vertex)
            for neighbour in self.imports.get(vertex, ()):
                if neighbour in path or visit(neighbour):
                    return True
            path.remove(vertex)
            return False

        if any(visit(v) for v in self.imports):
            raise ImportError('Infinite loop in imports: ' + ", ".join(path))

        exec(self.code[name], run_globals)
        new_module = type(sys)(name)
        new_module.__dict__.update(run_globals)

        return new_module

    def init_robot(self):
        self.initialized = True

        try:
            exec(self.code['robot'], self.globals, self.locals)
        except Exception:
            self.game_methods['robot_error'](sys.exc_info())

    def do_turn(self):
        self.bytecode += self.EXTRA_BYTECODE
        
        if 'turn' in self.locals:
            try:
                self.locals['turn']()
            except Exception:
                self.game_methods['robot_error'](sys.exc_info())

        else:
            try:
                raise RuntimeError('Couldn\'t find turn function.')
            except:
                self.game_methods['robot_error'](sys.exc_info())

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
