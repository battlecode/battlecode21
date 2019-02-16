from instrument import instrument
from runner import run_robots, RobotRunner
from time import time
import dis
import sys
import importlib._bootstrap_external
from RestrictedPython import compile_restricted, safe_builtins, utility_builtins, limited_builtins
import traceback 
import marshal, pickle

code = """
from path import path

print(path())
"""

path = """
def path():
    return 2
"""


path_bytecode = instrument(compile(path, 'path.py', 'exec'))
bytecode = instrument(compile(code, 'robot.py', 'exec'))
code = {'robot':bytecode, 'path':path_bytecode}

def code_to_file(code, filename):
    packet = {}
    for key in code:
        packet[key] = marshal.dumps(code[key])

    with open(filename, 'wb') as f:
        pickle.dump(packet, f)

def file_to_code(filename):
    with open(filename, 'rb') as f:
        packet = pickle.load(f)

    for key in packet:
        packet[key] = marshal.loads(packet[key])

    return packet

code_to_file(code, 'code.bcpx')
the_code = file_to_code('code.bcpx')

def robot_error(e):
    exc_type, exc_value, exc_traceback = e
    print("".join(traceback.format_exception(exc_type, exc_value, exc_traceback)))

runner = RobotRunner(the_code, game_methods={'robot_error':robot_error, 'print': print})
run_robots([runner])