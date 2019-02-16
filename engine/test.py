from runner import run_robots, RobotRunner
import traceback 
import marshal, pickle
from code import Code

code = Code.from_directory('./examplefuncsplayer')

def robot_error(e):
    exc_type, exc_value, exc_traceback = e
    print("".join(traceback.format_exception(exc_type, exc_value, exc_traceback)))

runner = RobotRunner(code, game_methods={'robot_error':robot_error, 'print': print}, debug=True)

run_robots([runner])
#run_robots([runner])
