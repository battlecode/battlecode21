from runner import run_robots, RobotRunner
import traceback 
import marshal, pickle
from code_container import CodeContainer
from time import time

code = CodeContainer.from_directory('./examplefuncsplayer')

errors = []
def robot_error(e):
    exc_type, exc_value, exc_traceback = e
    print("".join(traceback.format_exception(exc_type, exc_value, exc_traceback)))

runner = RobotRunner(code, game_methods={
    'robot_error':robot_error,
    'log': print
}, debug=True)

run_robots([runner])

start = time()
for i in range(1):
    run_robots([runner])
print(time() - start)
#run_robots([runner])
