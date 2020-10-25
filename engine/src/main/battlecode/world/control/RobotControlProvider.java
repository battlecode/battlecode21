package battlecode.world.control;

import battlecode.common.RobotController;
import battlecode.common.RobotInfo;
import battlecode.world.GameWorld;
import battlecode.world.InternalRobot;

/**
 * Represents a tool that can handle controlling robots during a
 * match. This could be the scheduler-instrumenter infrastructure,
 * or something simpler to e.g. control the neutral or zombie team.
 *
 * Behavior *must* be deterministic or matches won't be reproducible.
 *
 * @author james
 */
public interface RobotControlProvider {

    /**
     * Signals to the provider that a match has started,
     * and gives it access to a GameWorld.
     *
     * The world must be initialized but might not have any robots
     * spawned yet.
     */
    void matchStarted(GameWorld world);

    /**
     * Tells the provider that the match has ended, and it can
     * release its resources.
     */
    void matchEnded();

    /**
     * Signals to the provider that it should prepare to
     * process the next round.
     */
    void roundStarted();

    /**
     * Signals to the provider that no more robots will be run this round.
     */
    void roundEnded();

    /**
     * Signals to the provider that a robot has spawned, and
     * gives it a handle to that robot.
     *
     * @param robot the newly spawned robot
     */
    void robotSpawned(InternalRobot robot);

    /**
     * Signals to the provider that the robot with the
     * given info has been killed, and it should stop processing it.
     *
     * SHOULD NOT MODIFY THE ROBOT OR WORLD.
     *
     * @param robot the freshly executed robot
     */
    void robotKilled(InternalRobot robot);

    /**
     * Instructs the provider to process a round for the given robot.
     *
     * @param robot the robot to process
     */
    void runRobot(InternalRobot robot);

    /**
     * Get the bytecodes used in the most recent round by the
     * given robot.
     *
     * @param robot the robot to check
     * @return the bytecodes used by the robot
     */
    int getBytecodesUsed(InternalRobot robot);

    /**
     * Determine whether the computation thread for the given
     * robot has terminated
     *
     * @param robot the robot to check
     * @return whether the robot is terminated or not
     */
    boolean getTerminated(InternalRobot robot);
}
