package testplayerclock;

import battlecode.common.Clock;
import battlecode.common.Direction;
import battlecode.common.GameActionException;
import battlecode.common.RobotController;

/**
 * @author james
 */
public class RobotPlayer {
    public static void run(RobotController rc) throws GameActionException {
        Clock.yield();
    }
}
