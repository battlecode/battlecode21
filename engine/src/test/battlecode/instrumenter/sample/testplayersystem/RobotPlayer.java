package testplayersystem;

import battlecode.common.RobotController;

/**
 * @author james
 */
public class RobotPlayer {
    @SuppressWarnings("unused")
    public static void run(RobotController rc) {

        String shouldTerminate = System.getProperty("bc.testing.should.terminate");
        if (shouldTerminate == null || !shouldTerminate.equals("true")) {
            // loop forever
            while (true);
        }
    }
}
