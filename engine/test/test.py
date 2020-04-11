from engine.container.code_container import CodeContainer
from time import time
from engine.game.game import Game

code = CodeContainer.from_directory('./examplefuncsplayer')

g = Game([code, code], debug=True)

start = time()
g.turn()
print(time() - start)
g.turn()
print(time() - start)
g.turn()
for _ in range(100):
    g.turn()