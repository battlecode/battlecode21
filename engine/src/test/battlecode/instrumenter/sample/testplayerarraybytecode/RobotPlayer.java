package testplayerarraybytecode;

import battlecode.common.RobotController;
import battlecode.common.Clock;

/**
 * @author jamie
 */
public class RobotPlayer {
    @SuppressWarnings("unused")
    public static void run(RobotController rc) {
	int arrayLength = 2;
	while (arrayLength <= 16) {
	    Clock.yield();
	    byte[] b = new byte[arrayLength];
	    Clock.yield();
	    arrayLength *= 2;
	}
    }
}

