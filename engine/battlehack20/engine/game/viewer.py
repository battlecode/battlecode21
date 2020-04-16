import time
import sys
import datetime

from .team import Team

class BasicViewer:
    def __init__(self, board_size, board_states, colors=True):
        self.board_size = board_size
        self.board_states = board_states
        self.colors = colors

    def play(self, delay=0.5, keep_history=False):
        print('')

        for state_index in range(len(self.board_states)):
            self.view(state_index)
            time.sleep(delay)
            if not keep_history:
                self.clear()

        self.view(-1)

    def play_synchronized(self, poison_pill, delay=0.5, keep_history=False):
        print('')
        
        state_index = 0
        last_time = datetime.datetime.now().timestamp()
        while state_index < len(self.board_states) or not poison_pill.is_set():
            while len(self.board_states) <= state_index or datetime.datetime.now().timestamp() - last_time < delay:
                time.sleep(0.1)
            if not keep_history and state_index > 0:
                self.clear()
            self.view(state_index)
            last_time = datetime.datetime.now().timestamp()
            state_index += 1
            
            



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
                        new_board += '\033[0m\u001b[0m'
                    new_board += '] '
                else:
                    new_board += '[    ] '
            new_board += '\n'
        return new_board
