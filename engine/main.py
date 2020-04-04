#!/usr/bin/env python3
import time
import argparse

from battlecode.engine.container.code_container import CodeContainer
from battlecode.engine.game.game import Game
from battlecode.engine.game.viewer import BasicViewer
import faulthandler


if __name__ == '__main__':

    parser = argparse.ArgumentParser()
    parser.add_argument('player', nargs='+', help="Player")
    args = parser.parse_args()

    faulthandler.enable()

    code_container1 = CodeContainer.from_directory(args.player[0])
    code_container2 = CodeContainer.from_directory(args.player[1] if len(args.player) > 1 else args.player[0])

    game = Game([code_container1, code_container2], debug=True)

    start = time.time()
    print(f'Start Time: {start}')

    while True:
        if not game.running:
            break
        game.turn()

    viewer = BasicViewer(8, game.board_states)
    viewer.play(delay=0.8)

    print(f'{game.winner} wins!')
