import time

from engine.container.code_container import CodeContainer
from engine.game.game import Game
from engine.game.viewer import BasicViewer
import faulthandler


if __name__ == '__main__':

    faulthandler.enable()

    code_container = CodeContainer.from_directory('./examplefuncsplayer')

    game = Game([code_container, code_container], debug=True)

    start = time.time()
    print(f'Start Time: {start}')

    while True:
        if not game.running:
            break
        game.turn()

    viewer = BasicViewer(8, game.board_states)
    viewer.play(delay=0.8)

    print(f'{game.winner} wins!')
