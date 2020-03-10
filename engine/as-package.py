import time
import faulthandler

from battlecode import CodeContainer, Game, BasicViewer

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
