import time

from engine.container.code_container import CodeContainer
from engine.game.game import Game

code_container = CodeContainer.from_directory('./examplefuncsplayer')

game = Game([code_container, code_container], debug=True)

start = time.time()
print(f'Start Time: {start}')
for _ in range(100):
    game.turn()
exit(0)