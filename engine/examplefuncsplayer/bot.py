import random


# This is an example bot written by the developers!
# Use this to help write your own code, or run it against your bot to see how well you can do!

def turn():
    """
    MUST be defined for robot to run
    This function will be called at the beginning of every turn and should contain the bulk of your robot commands
    """
    log('Starting Turn!')

    team = get_team()
    log('Team: ' + str(team))

    robottype = get_type()
    log('Type: ' + str(robottype))

    bytecode = get_bytecode()
    log('Bytecode: ' + str(bytecode))

    if robottype == RobotType.PAWN:
        row, col = get_location()
        log('My location is: ' + str(row) + ' ' + str(col))

        if team == Team.WHITE:
            dir = 1
        else:
            dir = -1

        try:
            capture(row + dir, col + 1)
            log('Captured at: (' + str(row + dir) + ', ' + str(col + 1) + ')')
        except RobotError:
            pass

        try:
            capture(row + dir, col - 1)
            log('Captured at: (' + str(row + dir) + ', ' + str(col - 1) + ')')
        except RobotError:
            pass

        try:
            move_forward()
            log('Moved forward!')
        except RobotError:
            pass

        log('uncomment this line to get a segfault')

    else:
        board_size = get_board_size()

        if team == Team.WHITE:
            index = 0
        else:
            index = board_size - 1

        for _ in range(board_size):
            i = random.randint(0, board_size - 1)
            if not check_space(index, i):
                spawn(index, i)
                log('Spawned unit at: (' + str(index) + ', ' + str(i) + ')')
                break

    log('done!')
