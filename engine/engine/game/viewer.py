import time
import sys

from engine.game.team import Team

class BasicViewer:
    def __init__(self, board_size, board_states):
        self.board_size = board_size
        self.board_states = board_states

    def play(self, delay=0.5):
        print('Visualizer: ')
        for state in self.board_states:
            pretty = self.view_board(state)
            print(pretty)
            time.sleep(delay)
            for i in range(self.board_size + 1):
                sys.stdout.write("\033[F")  # back to previous line
                sys.stdout.write("\033[K")  # clear line

        print(self.view_board(self.board_states[-1]))

    def view_board(self, board, colors=True):
        new_board = ''
        for i in range(self.board_size):
            for j in range(self.board_size):
                if board[i][j]:
                    new_board += '['
                    if colors:
                        if board[i][j].team == Team.WHITE:
                            new_board += '\033[1m\u001b[37m'
                        else:
                            new_board += '\033[1m\u001b[36m'
                    new_board += str(board[i][j])
                    if colors:
                        new_board += '\033[0m\u001b[0m] '
                else:
                    new_board += '[    ] '
            new_board += '\n'
        return new_board
