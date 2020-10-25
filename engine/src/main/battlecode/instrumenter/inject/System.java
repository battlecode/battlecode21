package battlecode.instrumenter.inject;

import battlecode.instrumenter.InstrumentationException;
import battlecode.instrumenter.RobotDeathException;
import battlecode.instrumenter.stream.EOFInputStream;
import battlecode.instrumenter.stream.PrintStreamWrapper;
import battlecode.server.Config;

import java.io.*;
import java.nio.channels.Channel;
import java.util.Map;
import java.util.Properties;

import static battlecode.instrumenter.InstrumentationException.Type.ILLEGAL;

/**
 * A wrapper for java.lang.System that prevents user code from getting access to
 * anything they shouldn't.
 *
 * The battlecode instrumenter sneakily replaces any references to java.lang.System with references to
 * battlecode.lang.System.
 *
 * Reloaded individually for every robot.
 *
 * @author adamd
 */
@SuppressWarnings("unused")
public final class System {
    /**
     * The actual output stream.
     */
    private static PrintStreamWrapper realOut = new PrintStreamWrapper();

    /**
     * A fake System.out.
     */
    public static PrintStream out = realOut;

    /**
     * A fake System.error.
     */
    public static PrintStream err = realOut;

    /**
     * A fake System.in.
     */
    public static InputStream in = new EOFInputStream();

    /**
     * Some system properties.
     */
    private static Properties props = new Properties();

    static {
        props.setProperty("java.version", "who knows?");
        props.setProperty("java.vendor", "who knows?");
        props.setProperty("java.vendor.url", "who knows?");
        props.setProperty("java.home", "who knows?");
        props.setProperty("java.class.version", "who knows?");
        props.setProperty("java.class.path", "who knows?");
        props.setProperty("os.name", "who knows?");
        props.setProperty("os.arch", "who knows?");
        props.setProperty("os.version", "who knows?");
        props.setProperty("file.separator", "who knows?");
        props.setProperty("path.separator", "who knows?");
        props.setProperty("line.separator", "who knows?");
        props.setProperty("user.name", "who knows?");
        props.setProperty("user.home", "who knows?");
        props.setProperty("user.dir", "who knows?");

        Config global = Config.getGlobalConfig();

        // Copy bc.testing stuff
        for (String key : global.getKeys()) {
            if (key.startsWith("bc.testing")) {
                props.put(key, global.get(key));
            }
        }
    }

    /**
     * Prevent construction.
     */
    private System() {
    }

    /**
     * Set System.out for this robot.
     * Used by SandboxedRobotPlayer.
     *
     * @param newOut the printstream to replace System.out with
     */
    @SuppressWarnings("unused")
    public static void setSystemOut(PrintStream newOut) {
        realOut.wrapped = newOut;
    }

    // Working System methods.

    // No reason not to let users modify these.

    public static void setIn(InputStream newIn) {
        throw new InstrumentationException(ILLEGAL, "You can't change System.in, sorry.");
    }

    public static void setOut(PrintStream newOut) {
        throw new InstrumentationException(ILLEGAL, "You can't change System.out, sorry.");
    }

    public static void setErr(PrintStream newErr) {
        throw new InstrumentationException(ILLEGAL, "You can't change System.err, sorry.");
    }

    public static Console console() {
        return null;
    }

    public static Channel inheritedChannel() {
        return null;
    }

    public static String lineSeparator() {
        return "\n";
    }

    public static void arraycopy(Object src, int srcPos, Object dest, int destPos, int length) {
        java.lang.System.arraycopy(src, srcPos, dest, destPos, length);
        if (length > 0)
            RobotMonitor.incrementBytecodes(length);
    }

    public static int identityHashCode(Object x) {
        return ObjectMethods.identityHashCode(x);
    }

    public static String getProperty(String key) {
        return props.getProperty(key);
    }

    public static String getProperty(String key, String def) {
        return props.getProperty(key, def);
    }

    public static String setProperty(String key, String value) {
        return (String) props.setProperty(key, value);
    }

    public static String clearProperty(String key) {
        return (String) props.remove(key);
    }

    public static void exit(int status) {
        throw new RobotDeathException();
    }
}

