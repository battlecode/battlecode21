package testplayerdebug;

import battlecode.common.RobotController;

/**
 * @author james
 */
public class RobotPlayer {
    public static void run(RobotController rc) {
        debug_recurse();
    }

    public static void debug_recurse() {
        debug_useLotsOfBytecode();
    }

    public static void debug_useLotsOfBytecode() {
        int[] i = new int[1000];
        System.arraycopy(i, 0, i, 0, 1000);
    }
}
