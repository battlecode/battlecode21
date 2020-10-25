package battlecode.world;

import battlecode.common.*;

import gnu.trove.list.array.TIntArrayList;
import org.junit.Test;

import static org.junit.Assert.*;

/**
 * Unit tests for RobotController. These are where the gameplay tests are.
 *
 * Using TestGame and TestMapBuilder as helpers.
 */
public class RobotControllerTest {
    public final double EPSILON = 1.0e-5; // Smaller epsilon requred, possibly due to strictfp? Used to be 1.0e-9

    /**
     * Tests the most basic methods of RobotController. This test has extra
     * comments to serve as an example of how to use TestMapBuilder and
     * TestGame.
     *
     * @throws GameActionException shouldn't happen
     */
    @Test
    public void testBasic() throws GameActionException {
        // Prepares a map with the following properties:
        // origin = [0,0], width = 10, height = 10, num rounds = 100
        // random seed = 1337
        // The map doesn't have to meet specs.
        LiveMap map = new TestMapBuilder("test", new MapLocation(0,0), 10, 10, 1337, 100, 5)
            .addRobot(0, Team.A, RobotType.HQ, new MapLocation(0, 0))
            .addRobot(1, Team.B, RobotType.HQ, new MapLocation(9, 9))
            .setSoup()
            .setWater()
            .setPollution()
            .setDirt()
            .build();

        // This creates the actual game.
        TestGame game = new TestGame(map);

        // Let's spawn a robot for each team. The integers represent IDs.
        int oX = game.getOriginX();
        int oY = game.getOriginY();
        final int minerA = game.spawn(oX + 3, oY + 3, RobotType.MINER, Team.A);
        final int minerB = game.spawn(oX + 1, oY + 1, RobotType.MINER, Team
                .B);
        InternalRobot minerABot = game.getBot(minerA);

        assertEquals(new MapLocation(oX + 3, oY + 3), minerABot.getLocation());

        // The following specifies the code to be executed in the next round.
        // Bytecodes are not counted, and yields are automatic at the end.
        game.round((id, rc) -> {
            if (id == minerA) {
                rc.move(Direction.EAST);
            } else if (id == minerB) {
                // do nothing
            }
        });

        // Let's assert that things happened properly.
        assertEquals(new MapLocation(
                oX + 4,
                oY + 3
        ), minerABot.getLocation());

        // Lets wait for 10 rounds go by.
        game.waitRounds(10);

        // hooray!
    }

    @Test
    public void testImmediateActions() throws GameActionException {
        LiveMap map = new TestMapBuilder("test", 0, 0, 100, 100, 1337, 1000, 50)
            .setSoup()
            .setWater()
            .setPollution()
            .setDirt()
            .build();
        TestGame game = new TestGame(map);

        final int a = game.spawn(1, 1, RobotType.MINER, Team.A);

        game.round((id, rc) -> {
            if (id != a) return;

            final MapLocation start = rc.getLocation();
            assertEquals(new MapLocation(1, 1), start);

            rc.move(Direction.EAST);

            final MapLocation newLocation = rc.getLocation();
            assertEquals(new MapLocation(2, 1), newLocation);
        });

        // Let delays go away
        game.waitRounds(10);
    }

    @Test
    public void testSpawns() throws GameActionException {
        LiveMap map = new TestMapBuilder("test", new MapLocation(0,0), 10, 10, 1337, 100, 5)
            .setSoup()
            .setWater()
            .setPollution()
            .setDirt()
            .build();

        // This creates the actual game.
        TestGame game = new TestGame(map);

        // Let's spawn a robot for each team. The integers represent IDs.
        final int refineryA = game.spawn(3, 3, RobotType.HQ, Team.A);

        // The following specifies the code to be executed in the next round.
        // Bytecodes are not counted, and yields are automatic at the end.
        game.getWorld().getTeamInfo().adjustSoup(Team.A, 500000);
        game.round((id, rc) -> {
            assertTrue("Can't build robot", rc.canBuildRobot(RobotType.MINER, Direction.EAST));
            rc.buildRobot(RobotType.MINER, Direction.EAST);
        });

        for (InternalRobot robot : game.getWorld().getObjectInfo().robots()) {
            if (robot.getID() != refineryA) {
                assertEquals(RobotType.MINER, robot.getType());
            }
        }

        // Lets wait for 10 rounds go by.
        game.waitRounds(10);

        // hooray!

    }
    
    /**
     * Ensure that actions take place immediately.
     */
    // @Test
    // public void testImmediateActions() throws GameActionException {
    //     LiveMap map= new TestMapBuilder("test", 0, 0, 100, 100, 1337, 1000).build();
    //     TestGame game = new TestGame(map);

    //     final int a = game.spawn(1, 1, RobotType.MINER, Team.A);

    //     game.round((id, rc) -> {
    //         if (id != a) return;

    //         final MapLocation start = rc.getLocation();
    //         assertEquals(new MapLocation(1, 1), start);

    //         rc.move(Direction.EAST);

    //         final MapLocation newLocation = rc.getLocation();
    //         assertEquals(new MapLocation(2, 1), newLocation);
    //     });

    //     // Let delays go away
    //     game.waitRounds(10);
    // }

    // @Test
    // public void testSpawns() throws GameActionException {
    //     LiveMap map = new TestMapBuilder("test", new MapLocation(0,0), 10, 10, 1337, 100)
    //         .build();

    //     // This creates the actual game.
    //     TestGame game = new TestGame(map);

    //     // Let's spawn a robot for each team. The integers represent IDs.
    //     final int archonA = game.spawn(3, 3, RobotType.ARCHON, Team.A);

    //     // The following specifies the code to be executed in the next round.
    //     // Bytecodes are not counted, and yields are automatic at the end.
    //     game.round((id, rc) -> {
    //         assertTrue("Can't build robot", rc.canBuildRobot(RobotType.GARDENER, Direction.EAST));
    //         rc.buildRobot(RobotType.GARDENER, Direction.EAST);
    //     });

    //     for (InternalRobot robot : game.getWorld().getObjectInfo().robots()) {
    //         if (robot.getID() != archonA) {
    //             assertEquals(RobotType.GARDENER, robot.getType());
    //         }
    //     }

    //     // Lets wait for 10 rounds go by.
    //     game.waitRounds(10);

    //     // hooray!

    // }

    // @Test
    // public void testNullSense() throws GameActionException {
    //     LiveMap map = new TestMapBuilder("test", new MapLocation(0,0), 10, 10, 1337, 100)
    //             .build();

    //     // This creates the actual game.
    //     TestGame game = new TestGame(map);

    //     final int soldierA = game.spawn(3, 5, RobotType.MINER, Team.A);
    //     final int soldierB = game.spawn(7, 5, RobotType.MINER, Team.B);

    //     game.round((id, rc) -> {
    //         if(id != soldierA) return;

    //         RobotInfo actualBot = rc.senseRobotAtLocation(new MapLocation(3,5));
    //         RobotInfo nullBot = rc.senseRobotAtLocation(new MapLocation(5,7));

    //         assertNotEquals(actualBot,null);
    //         assertEquals(nullBot,null);
    //     });
    // }

    // Check to ensure execution order is equal to spawn order
    // @Test
    // public void executionOrderTest() throws GameActionException {
    //     LiveMap map = new TestMapBuilder("test", new MapLocation(0,0), 50, 10, 1337, 100)
    //             .build();

    //     // This creates the actual game.
    //     TestGame game = new TestGame(map);

    //     final int TEST_UNITS = 10;

    //     int[] testIDs = new int[TEST_UNITS];

    //     for(int i=0; i<TEST_UNITS; i++) {
    //         testIDs[i] = game.spawn(2+i*3,5,RobotType.SOLDIER,Team.A);
    //     }
    //     final int archonA = game.spawn(40,5,RobotType.ARCHON,Team.A);
    //     final int gardenerA = game.spawn(46,5,RobotType.GARDENER,Team.A);

    //     TIntArrayList executionOrder = new TIntArrayList();

    //     game.round((id, rc) -> {
    //         if(rc.getType() == RobotType.SOLDIER) {
    //             executionOrder.add(id);
    //         } else if (id == archonA) {
    //             assertTrue(rc.canHireGardener(Direction.EAST));
    //             rc.hireGardener(Direction.EAST);
    //         } else if (id == gardenerA) {
    //             assertTrue(rc.canBuildRobot(RobotType.LUMBERJACK,Direction.EAST));
    //         } else {
    //             // If either the spawned gardener or the lumberjack run code in the first round, this will fail.
    //             assertTrue(false);
    //         }
    //     });

    //     // Assert IDs aren't in order (random change, but very unlikely unless something is wrong)
    //     boolean sorted = true;
    //     for(int i=0; i<TEST_UNITS-1; i++) {
    //         if (testIDs[i] < testIDs[i+1])
    //             sorted = false;
    //     }
    //     assertFalse(sorted);


    //     // Assert execution IS in order
    //     for(int i=0; i<TEST_UNITS; i++) {
    //         assertEquals(testIDs[i],executionOrder.get(i));
    //     }
    // }

    //     // Soldier can see tank
    //     game.round((id, rc) -> {
    //         if (id == soldierB) {
    //             RobotInfo[] robots = rc.senseNearbyRobots(-1, rc.getTeam().opponent());
    //             assertEquals(robots.length, 1);
    //         }
    //     });
    // }

    // @Test
    // public void turnOrderTest() throws GameActionException {
    //     LiveMap map = new TestMapBuilder("test", new MapLocation(0,0), 50, 50, 1337, 100)
    //             .build();

    //     TestGame game = new TestGame(map);

    //     // Spawn two tanks close enough such that a bullet fired from one
    //     // at the other will hit after updating once.
    //     final int tankA = game.spawn(10, 10, RobotType.TANK, Team.A);
    //     final int tankB = game.spawn(15, 10, RobotType.TANK, Team.B);
    // }

    // @Test
    // public void testImmediateCollisionDetection() throws GameActionException {
    //     LiveMap map = new TestMapBuilder("test", new MapLocation(0,0), 10, 10, 1337, 100)
    //             .build();

    //     // This creates the actual game.
    //     TestGame game = new TestGame(map);

    //     final int soldierA = game.spawn(2.99f,5,RobotType.SOLDIER,Team.A);
    //     final int soldierB = game.spawn(5,5,RobotType.SOLDIER,Team.B);

    //     game.waitRounds(20); // Let units mature

    //     game.round((id, rc) -> {
    //         if (id == soldierA) {
    //             RobotInfo[] nearbyRobots = rc.senseNearbyRobots();
    //             assertEquals(nearbyRobots.length,1);
    //             // Damage is done immediately
    //         }
    //     });

    //     game.getBot(soldierB).damageRobot(RobotType.SOLDIER.maxHealth-RobotType.SOLDIER.attackPower-1);

    //     game.round((id, rc) -> {
    //         if (id == soldierA) {
    //             RobotInfo[] nearbyRobots = rc.senseNearbyRobots();
    //             // Damage is done immediately and robot is dead
    //         }
    //     });
    // }
}