from RestrictedPython import compile_restricted, safe_builtins, Guards
import threading 
import threader
import sys
from time import sleep
import traceback
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

    def join(self):
        while self.is_alive():
            sleep(0.0001)

class RobotRunner():
    STARTING_BYTECODE = 10000
    EXTRA_BYTECODE    = 5000
    
    def __init__(self, code, game_methods, log_method, error_method, debug=False):
        self.locals = {}
        self.globals = {
            '__builtins__': dict(safe_builtins),
            '__name__':'__main__'
        }

        self.globals['__builtins__']['__metaclass__'] = type
        self.globals['__builtins__']['__instrument__'] = self.instrument_call
        self.globals['__builtins__']['__import__'] = self.import_call
        self.globals['__builtins__']['_getitem_'] = self.getitem_call
        self.globals['__builtins__']['_write_'] = self.write_call
        self.globals['__builtins__']['_getiter_'] = lambda i: i
        self.globals['__builtins__']['_inplacevar_'] = self.inplacevar_cal
        self.globals['__builtins__']['_unpack_sequence_'] = Guards.guarded_unpack_sequence
        self.globals['__builtins__']['_iter_unpack_sequence_'] = Guards.guarded_iter_unpack_sequence
        self.globals['__builtins__']['log'] = log_method
        self.globals['__builtins__']['enumerate'] = enumerate

        for key, value in game_methods.items():
            self.globals['__builtins__'][key] = value

        self.error_method = error_method
        self.game_methods = game_methods
        self.code = code
        self.imports = {}

        self.bytecode = self.STARTING_BYTECODE

        self.initialized = False

        self.debug = debug

    def inplacevar_cal(self, op, x, y):
        if not isinstance(op, str):
            raise SyntaxError('Unsupported in place op.')

        if op == '+=':
            return x + y

        elif op == '-=':
            return x - y

        elif op == '*=':
            return x * y

        elif op == '/=':
            return x / y

        else:
            raise SyntaxError('Unsupported in place op "' + op + '".')

    def write_call(self, obj):
        if isinstance(obj, type(sys)):
            raise RuntimeError('Can\'t write to modules.')

        elif isinstance(obj, type(lambda:1)):
            raise RuntimeError('Can\'t write to functions.')

        return obj

    def getitem_call(self, accessed, attribute):
        if isinstance(attribute, str) and len(attribute) > 0:
            if attribute[0] == '_':
                raise RuntimeError('Cannot access attributes that begin with "_".')

        return accessed[attribute]

    def instrument_call(self):
        if self.bytecode == 0:
            self.error_method('Ran out of bytecode.')
            
            threading.current_thread().end()

            while True:
                sleep(0.0001)
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
            
            if name == 'random':
                import random
                return random

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
        try:
            exec(self.code['robot'], self.globals, self.locals)            
            self.globals.update(self.locals)
            self.initialized = True
        except RuntimeError:
            threading.current_thread().end()
        except Exception:
            self.error_method(traceback.format_exc(limit=5))

    def do_turn(self):
        self.bytecode += self.EXTRA_BYTECODE
        
        if 'turn' in self.locals and isinstance(self.locals['turn'], type(lambda:1)):
            try:
                exec(self.locals['turn'].__code__, self.globals, self.locals)
            except RuntimeError:
                threading.current_thread().end()
            except Exception:
                self.error_method(traceback.format_exc(limit=5))
        else:
            self.error_method('Couldn\'t find turn function.')
       
        
    def run(self):
        thread = RobotThread(self)
        thread.start()
        thread.join()