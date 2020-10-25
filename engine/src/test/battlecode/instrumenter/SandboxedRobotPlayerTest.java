package battlecode.instrumenter;

import battlecode.common.MapLocation;
import battlecode.common.RobotController;
import battlecode.common.RobotType;
import battlecode.common.Team;
import battlecode.instrumenter.stream.SilencedPrintStream;
import battlecode.server.Config;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

/**
 * Tests for SandboxedRobotPlayer.
 *
 * IF YOU NEED TO LOAD A NEW TEST PLAYER ADD IT TO setupFolder(),
 * OTHERWISE IT WON'T BE INSTRUMENTED.
 *
 * @author james
 */
public class SandboxedRobotPlayerTest {

    static String tempClassFolder;
   /* @BeforeClass
    public static void setupFolder() throws Exception {
        tempClassFolder = URLUtils.toTempFolder(
                "testplayeractions/RobotPlayer.class",
                "testplayerarray/RobotPlayer.class",
                "testplayerarraybytecode/RobotPlayer.class",
                "testplayerbytecode/RobotPlayer.class",
                "testplayerclock/RobotPlayer.class",
                "testplayerdebug/RobotPlayer.class",
                "testplayerempty/RobotPlayer.class",
                "testplayerloopforever/RobotPlayer.class",
                "testplayermultiarraybytecode/RobotPlayer.class",
                "testplayernodebug/RobotPlayer.class",
                "testplayerstatic/RobotPlayer.class",
                "testplayersuicide/RobotPlayer.class",
                "testplayersystem/RobotPlayer.class",
                "testplayersystemout/RobotPlayer.class",
                "testplayerusesshared/RobotPlayer.class",
                "shared/SharedUtility.class"
        );
    }

    static PrintStream out = SilencedPrintStream.theInstance();

    TeamClassLoaderFactory factory;
    TeamClassLoaderFactory.Loader loader;
    RobotController rc;

    @Before
    public void setupController() throws Exception {
        // Uses the "mockito" library to create a mock RobotController object,
        // so that we don't have to create a GameWorld and all that
        rc = mock(RobotController.class);

        // SandboxedRobotPlayer uses rc.getTeam; tell it we're team A
        when(rc.getTeam()).thenReturn(Team.A);
        when(rc.getType()).thenReturn(RobotType.HQ); // TODO?!
        when(rc.getID()).thenReturn(0);
        when(rc.getLocation()).thenReturn(new MapLocation(0, 0));
        when(rc.getRoundNum()).thenReturn(0);

        factory = new TeamClassLoaderFactory(tempClassFolder);
        loader = factory.createLoader();
    }

    @Test
    public void testLifecycleEmptyPlayer() throws Exception {
        SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayerempty", rc, 0, loader, out);

        player.setBytecodeLimit(10000);

        player.step();

        // Player should immediately return.

        assertTrue(player.getTerminated());
    }

    @Test
    public void testRobotControllerMethodsCalled() throws Exception {
        SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayeractions", rc, 0, loader, out);

        player.setBytecodeLimit(10000);

        player.step();

        assertTrue(player.getTerminated());

        // Make sure that the player called the correct methods

        verify(rc).resign();
        verify(rc).senseNearbyRobots();
    }

    // @Test
    // public void testYield() throws Exception {
    //     SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayerclock", rc, 0, loader, out);
    //     player.setBytecodeLimit(10000);

    //     player.step();

    //     assertFalse(player.getTerminated());

    //     player.step();

    //     assertFalse(player.getTerminated());

    //     player.step();

    //     assertTrue(player.getTerminated());
    // }

    @Test
    public void testBytecodeCountingWorks() throws Exception {
        SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayerloopforever", rc, 0, loader, out);
        player.setBytecodeLimit(100);

        player.step();

        // The real test is whether step returns at all, since the player doesn't yield or terminate;
        // still, we should test that the player hasn't terminated

        assertFalse(player.getTerminated());

    }

    @Test(timeout=300)
    public void testAvoidDeadlocks() throws Exception {
        SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayersuicide", rc, 0, loader, out);
        player.setBytecodeLimit(10);

        // Attempt to kill the player when it calls "disintegrate"
        // This used to deadlock because both step() and terminate() were synchronized.
        doAnswer(invocation -> {
            player.terminate();
            return null;
        }).when(rc).disintegrate();

        player.step();

        // And if the method returns, we know we have no deadlocks.
        assertTrue(player.getTerminated());
    }

    @Test
    public void testStaticInitialization() throws Exception {
        SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayerstatic", rc, 0, loader, out);
        player.setBytecodeLimit(10000);

        // Player calls "yield" in static initializer
        player.step();
        assertFalse(player.getTerminated());

        // Player terminates when actual "run" starts
        player.step();
        assertTrue(player.getTerminated());
    }

    @Test
    public void testBytecodeOveruse() throws Exception {
        SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayerbytecode", rc, 0, loader, out);
        player.setBytecodeLimit(200);

        for (int i = 0; i < 10; i++) {
            player.step();
            assertFalse(player.getTerminated());
        }

        player.step();
        assertTrue(player.getTerminated());
    }


    @Test
    public void testArrayLooping() throws Exception {
        SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayerarray", rc, 0, loader, out);
        player.setBytecodeLimit(10000);

        player.step();
        player.step();
    }

    @Test
    public void testArrayBytecode() throws Exception {
        SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayerarraybytecode", rc, 0, loader, out);
        player.setBytecodeLimit(10000);

	int[] bytecodesUsed = new int[4];
	
        for (int i = 0; i < 4; i++) {
            player.step();
	    player.step();
            assertFalse(player.getTerminated());
	    bytecodesUsed[i] = player.getBytecodesUsed();
        }

	int baseBytecodes = 2*bytecodesUsed[0] - bytecodesUsed[1];
	int[] expectedBytecode = {2, 4, 8, 16};

	for (int i = 0; i < 4; i++)
	    assertTrue(bytecodesUsed[i] == baseBytecodes + expectedBytecode[i]);
	    
        player.step();
        assertTrue(player.getTerminated());
    }

    @Test
    public void testMultiArrayBytecode() throws Exception {
        SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayermultiarraybytecode", rc, 0, loader, out);
        player.setBytecodeLimit(10000);

	int[] bytecodesUsed = new int[4];
	
        for (int i = 0; i < 4; i++) {
            player.step();
	    player.step();
            assertFalse(player.getTerminated());
	    bytecodesUsed[i] = player.getBytecodesUsed();
        }

	int baseBytecodes = (6*bytecodesUsed[0] - bytecodesUsed[1]) / 5;
	int[] expectedBytecode = {24, 144, 864, 5184};

	for (int i = 0; i < 4; i++)
	    assertTrue(bytecodesUsed[i] == baseBytecodes + expectedBytecode[i]);
	
        player.step();
        assertTrue(player.getTerminated());
    }

    @Test
    public void testBcTesting() throws Exception {
        Config.getGlobalConfig().set("bc.testing.should.terminate", "true");

        SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayersystem", rc, 0, loader, out);
        player.setBytecodeLimit(200);

        player.step();
        assertTrue(player.getTerminated());
    }

    @Test
    public void testDebugMethodsEnabled() throws Exception {
        Config.getGlobalConfig().set("bc.engine.debug-methods", "true");

        SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayerdebug", rc, 0, loader, out);
        player.setBytecodeLimit(100);

        player.step();
        assertTrue(player.getTerminated());
    }

    @Test
    public void testDebugMethodsDisabled() throws Exception {
        Config.getGlobalConfig().set("bc.engine.debug-methods", "false");

        SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayernodebug", rc, 0, loader, out);
        player.setBytecodeLimit(200);

        player.step();
        assertTrue(player.getTerminated());
    }

    @Test
    public void testUseShared() throws Exception {
        SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayerusesshared", rc, 0, loader, out);
        player.setBytecodeLimit(200);
        player.step();
        assertTrue(player.getTerminated());
    }
    */
    // @Test
    // public void testPlayerSystemOut() throws Exception {
    //     ByteArrayOutputStream out = new ByteArrayOutputStream();
    //     PrintStream outPrinter = new PrintStream(out, false, "UTF-8");
    //     SandboxedRobotPlayer player = new SandboxedRobotPlayer("testplayersystemout", rc, 0, loader,
    //             outPrinter);
    //     player.setBytecodeLimit(200);
    //     player.step();
    //     assertTrue(player.getTerminated());

    //     //outPrinter.flush();
    //     //out.flush();

    //     assertEquals("[A:ARCHON#0@0] I LOVE MEMES\nthis shouldn't have a header\n",
    //             out.toString("UTF-8"));
    // }
}
