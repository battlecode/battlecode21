package battlecode.instrumenter.inject;

import battlecode.instrumenter.SandboxedRobotPlayer;
import battlecode.server.ErrorReporter;

import java.io.PrintStream;
import java.lang.Math;
import java.lang.Integer;

/**
 * The class used to count bytecodes and debug levels at player runtime; calls to its methods are injected
 * by the instrumenter.
 *
 * Don't let the fact that this class is "static" fool you. It's static for instrumentation convenience;
 * a new version is loaded every time a new robot player is loaded, and is specific to that robot.
 *
 * The specific call the instrumentation uses is "incrementBytecodes".
 *
 * @author adamd
 */
public final class RobotMonitor {
    private static int bytecodeLimit;

    private static int randomSeed;

    private static int bytecodesLeft;
    private static int bytecodesToRemove;
    private static boolean shouldDie;
    private static int debugLevel;

    private static SandboxedRobotPlayer.Pauser pauser;
    private static SandboxedRobotPlayer.Killer killer;

    // Methods called from SandboxedRobotPlayer

    /**
     * A "constructor".
     * Initializes the monitor.
     *
     * Called in the robot thread from SandboxedRobotPlayer.
     *
     * @param thePauser pauser to use to pause the thread
     */
    @SuppressWarnings("unused")
    public static void init(SandboxedRobotPlayer.Pauser thePauser,
                            SandboxedRobotPlayer.Killer theKiller,
                            int seed) {
        shouldDie = false;
        bytecodesLeft = 0;
        debugLevel = 0;

        randomSeed = seed;
        pauser = thePauser;
        killer = theKiller;
    }

    /**
     * Set the bytecode limit of this robot.
     *
     * @param limit the new limit
     */
    @SuppressWarnings("unused")
    public static void setBytecodeLimit(int limit) {
        bytecodeLimit = limit;
    }

    /**
     * Set System.out for this robot.
     *
     * @param out the printstream to replace System.out with
     */
    @SuppressWarnings("unused")
    public static void setSystemOut(PrintStream out) {
        System.out = out;
        System.err = out;
    }

    /**
     * Kills the robot associated with this monitor.
     *
     * More specifically, the next time the thread is activated, it will throw a RobotDeathException.
     */
    @SuppressWarnings("unused")
    public static void killRobot() {
        shouldDie = true;
    }

    /**
     * @return the bytecode number that the active robot is currently on.
     *         Note that this can be above bytecodeLimit in some cases.
     */
    @SuppressWarnings("unused")
    public static int getBytecodeNum() {
        return bytecodeLimit - getBytecodesLeft();
    }

    /**
     * @return the bytecodes this robot has left to use.
     */
    @SuppressWarnings("unused")
    public static int getBytecodesLeft() {
        return bytecodesLeft;
    }

    // Methods called from RobotPlayer

    /**
     * Increments the currently active robot's bytecode count by the given amount.
     * If the robot exceeds its bytecode limit for the round, this method will block until the robot's next round.
     * Should be called at the end of every basic block.
     *
     * THIS METHOD IS CALLED BY THE INSTRUMENTER.
     *
     * @param numBytecodes the number of bytecodes the robot just executed
     */
    @SuppressWarnings("unused")
    public static void incrementBytecodes(int numBytecodes) {
        // If we should die, then... do that.
        if (shouldDie) {
            killer.kill();
        }

        if (debugLevel == 0) {
            try {
                // check for integer overflow exploits
                bytecodesLeft = Math.subtractExact(bytecodesLeft, numBytecodes);
                bytecodesLeft = Math.subtractExact(bytecodesLeft, bytecodesToRemove);
            } catch (ArithmeticException e) {
                bytecodesLeft = Integer.MIN_VALUE;
            }

            while (bytecodesLeft <= 0) {
                pause();
            }
        }
	
	    bytecodesToRemove = 0;
    }

    /**
     * "Increments" the currently active robot's bytecode count by the given amount.
     * Specifically, this incrementation actually happens when incrementBytecodes is next called.
     * This method is needed for cases where the nature of bytecode incrementation is dependent on
     * the state of the player (e.g. array initialization).
     *
     * THIS METHOD IS CALLED BY THE INSTRUMENTER.
     *
     * @param numBytecodes the number of bytecodes the robot just executed
     */
    @SuppressWarnings("unused")
    public static void incrementBytecodesWithoutInterrupt(int numBytecodes) {
        // Several potential exploits mean this argument may be passed a negative value.
        // It's easier to deal with this here than in the instrumenter.
        if (numBytecodes > 0) {
            try {
                bytecodesToRemove = Math.addExact(bytecodesToRemove, numBytecodes);  // to prevent integer overflow
            } catch (ArithmeticException e) {
                bytecodesToRemove = Integer.MAX_VALUE;
            }
        }
    }

    /**
     * When initializing an array, we need to pretend that all indices are at
     * least 1, for the purposes of calculating bytecode cost. Because this
     * calculation needs to be done in the instrumenter (and implemented in
     * bytecode), the use of even simple helper methods like this dramatically
     * simplifies the instrumenter code.
     *
     * THIS METHOD IS CALLED BY THE INSTRUMENTER.
     *
     * @param index the index to sanitize
     *
     * @return the sanitized array index.
     */
    @SuppressWarnings("unused")
    public static int sanitizeArrayIndex(int index) {
        return Math.max(1, index);
    }

    /**
     * Calculates the bytecode cost of initializing a multidimensional array with the given
     * dimensions. Note that the dimensions are passed in reverse order (so calling
     * new int[1][2][3] passes this method the parameter {3, 2, 1}.
     *
     * THIS METHOD IS CALLED BY THE INSTRUMENTER.
     *
     * @param dims the dimensions of the multidimensional array, in reverse order
     *
     * @return the bytecode cost of instantiated the described array.
     */
    @SuppressWarnings("unused")
    public static int calculateMultiArrayCost(int[] dims) {
        int cost = 1;
        for (int i = dims.length - 1; i >= 0; i--) {
            cost *= Math.max(dims[i], 1);
        }

        return cost;
    }

    /**
     * Called when entering a debug_ method.
     *
     * THIS METHOD IS CALLED BY THE INSTRUMENTER.
     */
    @SuppressWarnings("unused")
    public static void incrementDebugLevel() {
        debugLevel++;
    }

    /**
     * Called when exiting a debug_ method.
     *
     * THIS METHOD IS CALLED BY THE INSTRUMENTER.
     */
    @SuppressWarnings("unused")
    public static void decrementDebugLevel() {
        debugLevel--;
        if (debugLevel < 0) {
            ErrorReporter.report("Debug level below zero, this should be impossible!", true);
            killRobot();
        }
    }


    /**
     * Used to construct new Random instances.
     *
     * THIS METHOD IS CALLED BY THE INSTRUMENTER.
     *
     * @return the random seed for this robot
     */
    public static long getRandomSeed() {
        return randomSeed;
    }

    /**
     * Pauses the run of the current robot.
     *
     * Must be called from the robot's main thread.
     */
    public static void pause() {
        pauser.pause();

        reactivate();
    }

    /**
     * Restarts a paused robot.
     *
     * Must be called from the robot's main thread.
     */
    public static void reactivate() {
        // If we should die, then... do that.
        if (shouldDie) {
            killer.kill();
        }

        if (bytecodesLeft < 0) {
            bytecodesLeft += bytecodeLimit;
        } else {
            bytecodesLeft = bytecodeLimit;
        }
    }
}
