import sys
import traceback
import pdb

from RestrictedPython import safe_builtins, limited_builtins, utility_builtins, Guards
from threading import Thread, Event
from time import sleep
from .instrument import Instrument


class RobotThread(Thread):
    def __init__(self, runner):
        Thread.__init__(self)
        self.pause_event = Event()
        self.paused = False
        self.stopped = False
        self.runner = runner

    def run(self):
        if not self.runner.initialized:
            self.runner.init_robot()

        self.runner.do_turn()

        self.stopped = True

    def wait(self):
        self.paused = True
        self.pause_event.wait()
        if self.stopped:
            self.kill()

        self.pause_event.clear()
        self.paused = False

    def stop(self):
        self.stopped = True

    def kill(self):
        exit(0)


class WrapperThread(Thread):
    def __init__(self, thread):
        Thread.__init__(self)
        self.thread = thread

    def run(self):
        if self.thread.paused:
            self.thread.pause_event.set()
        else:
            self.thread.start()
        while True:
            sleep(0.001)
            if self.thread.paused or self.thread.stopped:
                break


class RobotRunner:
    STARTING_BYTECODE = 20000
    EXTRA_BYTECODE = 20000

    def __init__(self, code, game_methods, log_method, error_method, debug=False):
        self.instrument = Instrument(self)
        self.locals = {}
        self.globals = {
            '__builtins__': dict(i for dct in [safe_builtins, limited_builtins, utility_builtins] for i in dct.items()),
            '__name__': '__main__'
        }

        self.globals['__builtins__']['__metaclass__'] = type
        self.globals['__builtins__']['__instrument__'] = self.instrument_call
        self.globals['__builtins__']['__multinstrument__'] = self.multinstrument_call
        self.globals['__builtins__']['__import__'] = self.import_call
        self.globals['__builtins__']['_getitem_'] = self.getitem_call
        self.globals['__builtins__']['_write_'] = self.write_call
        self.globals['__builtins__']['_getiter_'] = lambda i: i
        self.globals['__builtins__']['_inplacevar_'] = self.inplacevar_call
        self.globals['__builtins__']['_unpack_sequence_'] = Guards.guarded_unpack_sequence
        self.globals['__builtins__']['_iter_unpack_sequence_'] = Guards.guarded_iter_unpack_sequence

        self.globals['__builtins__']['log'] = log_method
        self.globals['__builtins__']['enumerate'] = enumerate

        # instrumented methods
        self.globals['__builtins__']['sorted'] = self.instrument.instrumented_sorted

        for key, value in game_methods.items():
            self.globals['__builtins__'][key] = value

        self.error_method = error_method
        self.game_methods = game_methods
        self.code = code
        self.imports = {}

        self.bytecode = self.STARTING_BYTECODE

        self.thread = None
        self.initialized = False

        self.debug = debug

    @staticmethod
    def inplacevar_call(op, x, y):
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

    @staticmethod
    def write_call(obj):
        if isinstance(obj, type(sys)):
            raise RuntimeError('Can\'t write to modules.')

        elif isinstance(obj, type(lambda: 1)):
            raise RuntimeError('Can\'t write to functions.')

        return obj

    @staticmethod
    def getitem_call(accessed, attribute):
        if isinstance(attribute, str) and len(attribute) > 0:
            if attribute[0] == '_':
                raise RuntimeError('Cannot access attributes that begin with "_".')

        return accessed[attribute]

    def instrument_call(self):
        self.bytecode -= 1
        self.check_bytecode()

    def multinstrument_call(self, n):
        if n < 0:
            raise ValueError('n must be greater than 0')
        self.bytecode -= n
        self.check_bytecode()

    def check_bytecode(self):
        if self.bytecode <= 0:
            self.error_method(f'Ran out of bytecode.Remaining bytecode: {self.bytecode}')
            self.thread.wait()

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
        run_globals = {'__builtins__': my_builtins, '__name__': name}

        # Loop check: keep dictionary of who imports who.  If loop, error.
        # First, we build a directed graph:
        if not caller in self.imports:
            self.imports[caller] = {name}
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
            exec(self.code['bot'], self.globals, self.locals)
            self.globals.update(self.locals)
            self.initialized = True
        except RuntimeError:
            self.force_kill()
            # current_thread().kill()
        except Exception:
            self.error_method(traceback.format_exc(limit=5))

    def do_turn(self):
        if 'turn' in self.locals and isinstance(self.locals['turn'], type(lambda: 1)):
            try:
                exec(self.locals['turn'].__code__, self.globals, self.locals)
            except RuntimeError:
                self.force_kill()
                # current_thread().kill()
            except Exception:
                self.error_method(traceback.format_exc(limit=5))
        else:
            self.error_method('Couldn\'t find turn function.')

    def run(self):
        self.bytecode = min(self.bytecode, 0) + self.EXTRA_BYTECODE

        if not self.thread:
            self.thread = RobotThread(self)

        self.wrapper = WrapperThread(self.thread)

        self.wrapper.start()
        self.wrapper.join()

        if self.thread.stopped:
            self.thread = None

    def kill(self):
        if self.thread:
            self.thread.stop()
            self.thread.pause_event.set()

    def force_kill(self):
        self.thread.wait()
        self.kill()
