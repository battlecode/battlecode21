package testplayernodebug;

import battlecode.common.RobotController;

/**
 * @author james
 */
public class RobotPlayer {
    @SuppressWarnings("unused")
    public static void run(RobotController rc) {
        boolean[] debugContainsTrue = {false};

        System.out.println(debugContainsTrue);
        System.out.println(debugContainsTrue[0]);

        debug_setTrue(debugContainsTrue);

        System.out.println(debugContainsTrue);
        System.out.println(debugContainsTrue[0]);

        if (debugContainsTrue[0]) {
            // loop forever
            while (true);
        }
    }

    public static void debug_setTrue(boolean[] param) {
        param[0] = true;
    }
}

