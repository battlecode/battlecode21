package testplayerbytecode;

import battlecode.common.RobotController;

/**
 * @author james
 */
public class RobotPlayer {
    @SuppressWarnings("unused")
    public static void run(RobotController rc) {
        byte[] b = new byte[1000];
        System.arraycopy(b, 0, b, 0, 1000);
    }
}
