package battlecode.server;

import java.io.BufferedReader;
import java.io.InputStreamReader;

/**
 * Utility class for determining the java version.
 *
 * @author james
 */
public class Version {
    /**
     * The version of battlecode.
     */
    public final static String version;

    static {
        String readVersion;
        try (final BufferedReader r = new BufferedReader(new InputStreamReader(
                            Version.class.getClassLoader().getResourceAsStream("battlecode-version")))) {
            readVersion = r.readLine();
        } catch (Exception e) {
            System.err.println("Can't open version");
            e.printStackTrace();
            readVersion = "UNKNOWN";
        }
        version = readVersion;
    }

    /**
     * @param args unused
     */
    public static void main(String[] args) {
        System.out.println(version);
    }
}
