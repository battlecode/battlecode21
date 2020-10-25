package battlecode.world;

import battlecode.common.*;
import battlecode.server.GameMaker;
import battlecode.world.control.RobotControlProvider;
import org.junit.Ignore;
import org.mockito.Mockito;

import java.util.function.Consumer;

/**
 * TestGame holds a GameWorld and contains utility methods to spawn units and execute rounds. The main purpose is to
 * make it easier to write tests for RobotController.
 *
 * Using this and TestMapGenerator, it becomes easier to set up game scenarios and execute RobotController commands. A
 * basic test will have the following flow. First, we create a TestMapGenerator to create a GameMap. We create a
 * TestGame and GameWorld around this GameMap and spawn some units. Then, we use the turn method to execute
 * RobotController commands. During these turns, we have asserts to test that the behaviors are correct.
 */
@Ignore
public class TestGame {
    /** The game world that everything is based on. */
    private final GameWorld world;

    /** The function to run on robots. */
    private Consumer<InternalRobot> runRobot;

    /** Any exception thrown while running the game. */
    private GameActionException exception;

    /**
     * Creates a test game with the given map.
     *
     * @param map the game map
     */
    public TestGame(LiveMap map) {
        world = new GameWorld(map,
                new TestControlProvider(),
                // this is a hack.
                // there should be a cleaner way to do this?
                Mockito.mock(GameMaker.MatchMaker.class));
    }

    /**
     * Returns the x coordinate of the map origin.
     *
     * @return the x coordinate of the map origin.
     */
    public int getOriginX() {
        return world.getGameMap().getOrigin().x;
    }

    /**
     * Returns the y coordinate of the map origin.
     *
     * @return the y coordinate of the map origin.
     */
    public int getOriginY() {
        return world.getGameMap().getOrigin().y;
    }

    /**
     * Spawns a robot of the given type and team on the given location, and returns its ID. Does not spend resources,
     * and all units are created with no delays.
     *
     * @param x x coordinate for the spawn
     * @param y y coordinate for the spawn
     * @param type type of the robot to spawn
     * @param team team of the robot to spawn
     */
    public int spawn(int x, int y, RobotType type, Team team) {
        return world.spawnRobot(type, new MapLocation(x, y), team);
    }

    /**
     * A helper class to deal with the fact that it's tricky for Java lambdas
     * to handle checked exceptions. This is equivalent to a BiConsumer,
     * except that "accept" throws GameActionException.
     */
    public interface BiConsumerWithException {
        void accept(int id, RobotController rc) throws GameActionException;
    }

    /**
     * Executes a round of gameplay. Each robot will receive a turn, with the robots spawned earlier going first.
     *
     * To perform the actions of the round, the input function f will be called on each robot in spawn order, with the
     * arguments being the robot's ID and the robot's RobotController. Thus, the function f that you supply must
     * use the ID to determine the corresponding action that the robot takes on this turn, and perform the actions
     * using the RobotController.
     *
     * @param f a function that, given an integer ID and a RobotController, will perform the actions for the robot with
     *          that ID for the current turn
     */
    public void round(BiConsumerWithException f) throws
            GameActionException {
        this.runRobot = (robot) -> {
            try {
                f.accept(robot.getID(), robot.getController());
            } catch (GameActionException e) {
                exception = e;
            }
        };

        world.runRound();
        if (exception != null) {
            throw exception;
        }
    }

    /**
     * Skips a number of rounds. The game state will change, but no robots
     * will perform actions.
     *
     * @param n the number of rounds to skip.
     */
    public void waitRounds(int n) {
        this.runRobot = (robot) -> {
        };

        for (int i = 0; i < n; ++i) {
            world.runRound();
        }
    }

    /**
     * Returns the InternalRobot associated with a given ID.
     *
     * @param id the ID of the robot to query
     * @return the InternalRobot for the given ID
     */
    public InternalRobot getBot(int id) {
        return world.getObjectInfo().getRobotByID(id);
    }

    /**
     * Returns the GameWorld.
     *
     * @return the GameWorld
     */
    public GameWorld getWorld() {
        return world;
    }

    private class TestControlProvider implements RobotControlProvider {

        @Override
        public void matchStarted(GameWorld world) {}

        @Override
        public void matchEnded() {}

        @Override
        public void roundStarted() {}

        @Override
        public void roundEnded() {}

        @Override
        public void robotSpawned(InternalRobot robot) {}

        @Override
        public void robotKilled(InternalRobot robot) {}

        @Override
        public void runRobot(InternalRobot robot) {
            runRobot.accept(robot);
        }

        @Override
        public int getBytecodesUsed(InternalRobot robot) {
            // BytecodesUsed defaults to zero in InternalRobot, so this gives us
            // the ability to change bytecodesUsed in a test case without it being
            // written back to zero
            return robot.getBytecodesUsed();
        }

        @Override
        public boolean getTerminated(InternalRobot robot) {
            return false;
        }
    }
}
