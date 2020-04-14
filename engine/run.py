import time
import argparse
import faulthandler
import sys

from battlehack20 import CodeContainer, Game, BasicViewer

"""
This is a simple script for running bots and debugging them.

Feel free to change this script to suit your needs!

Usage:

    python3 run.py examplefuncsplayer examplefuncsplayer

    This runs examplefuncsplayer against itself. (You can omit the second argument if you want to.)



    python3 -i run.py examplefuncsplayer examplefuncsplayer

    This launches an interactive shell where you can step through the game using step().
    This is great for debugging.
"""


def step(number_of_turns=1):
    """
    This function steps through the game the specified number of turns.

    It prints the state of the game after every turn.
    """

    for i in range(number_of_turns):
        if not game.running:
            print(f'{game.winner} has won!')
            break
        game.turn()
        viewer.view()



def play_all():
    """
    This function plays the entire game, and views it in a nice animated way.
    """

    while True:
        if not game.running:
            break
        game.turn()

    viewer.play(delay=0.8)

    print(f'{game.winner} wins!')



if __name__ == '__main__':

    # This is just for parsing the input to the script. Not important.
    parser = argparse.ArgumentParser()
    parser.add_argument('player', nargs='+', help="Player")
    args = parser.parse_args()

    # The faulthandler makes certain errors (segfaults) have nicer stacktraces.
    faulthandler.enable() 


    # This is where the interesting things start!

    # Every game needs 2 code containers with each team's bot code.
    code_container1 = CodeContainer.from_directory(args.player[0])
    code_container2 = CodeContainer.from_directory(args.player[1] if len(args.player) > 1 else args.player[0])

    # This is how you initialize a game,
    game = Game([code_container1, code_container2], board_size=16, debug=True)
    
    # ... and the viewer.
    viewer = BasicViewer(16, game.board_states)


    # Here we check if the script is run using the -i flag.
    # If it is not, then we simply play the entire game.
    if not sys.flags.interactive:
        play_all()


