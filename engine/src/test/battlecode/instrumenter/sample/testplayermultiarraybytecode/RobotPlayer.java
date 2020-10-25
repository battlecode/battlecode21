package testplayermultiarraybytecode;

import battlecode.common.RobotController;
import battlecode.common.Clock;

/**
 * @author jamie
 */
public class RobotPlayer {
    @SuppressWarnings("unused")
    public static void run(RobotController rc) {
	int x = 2;
	int y = 3;
	int z = 4;
	while (x <= 16) {
	    Clock.yield();
	    byte[][][][] b = new byte[x][y][z][0];
	    Clock.yield();
	    x *= 2;
	    y *= 3;
	}
    }
}
