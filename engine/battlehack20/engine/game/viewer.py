import time
import sys

from .team import Team

class BasicViewer:
    def __init__(self, board_size, board_states, colors=True):
        self.board_size = board_size
        self.board_states = board_states
        self.colors = colors

    def play(self, delay=0.5):
        print('Visualizer: ')

        for state_index in range(len(self.board_states)):
            self.view(state_index)
            time.sleep(delay)
            self.clear()

        self.view(-1)

    def clear(self):
        for i in range(self.board_size + 1):
            sys.stdout.write("\033[F")  # back to previous line
            sys.stdout.write("\033[K")  # clear line
    
    def view(self, index=-1):
        print(self.view_board(self.board_states[index]))

    def view_board(self, board):
        new_board = ''
        for i in range(self.board_size):
            for j in range(self.board_size):
                if board[i][j]:
                    new_board += '['
                    if self.colors:
                        if board[i][j].team == Team.WHITE:
                            new_board += '\033[1m\u001b[37m'
                        else:
                            new_board += '\033[1m\u001b[36m'
                    new_board += str(board[i][j])
                    if self.colors:
                        new_board += '\033[0m\u001b[0m] '
                else:
                    new_board += '[    ] '
            new_board += '\n'
        return new_board
