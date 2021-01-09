package battlecode.instrumenter;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static battlecode.instrumenter.InstrumentationException.Type.MISSING;

/**
 * Used to verify that a team's submission will pass the instrumenter when it's run.
 * <p/>
 * Usage:<br>
 * <code>java Verifier teamXXX</code><br>
 * If the submission passes, the Java process will return 0, and there will be no output to stderr.  If the
 * submission fails, the Java process will return 1, and there will be error messages in stderr.
 *
 * @author adamd
 */
public class Verifier {
    public static void main(String[] args) {
        if (args.length != 2) {
            System.err.println("Usage: battlecode.instrumenter.Verifier ${team} ${team.url}, where team is a package" +
                    "containing a RobotPlayer and team.url is a folder or jar containing all of the player-defined class files" +
                    "for that RobotPlayer");
        }
        if (!verify(args[0], args[1])) System.exit(1);
    }

    public static boolean verify(String teamPackageName, String teamURL) {
        try {
            TeamClassLoaderFactory.Loader loader = new TeamClassLoaderFactory(teamURL).createLoader(false);

            // Has teamPackageName/RobotPlayer.java
            loader.loadClass(teamPackageName + ".RobotPlayer");

            // Everything else is valid
            if (teamURL.endsWith(".jar")) checkJar(teamPackageName + ".RobotPlayer", teamURL, loader);
            else checkFolder(teamPackageName + ".RobotPlayer", teamURL, loader);

            return true;
        } catch (Exception e) {
            System.out.println(e.getMessage());
            e.printStackTrace(System.out);
            return false;
        }
    }

    public static void checkJar(String rpName, String url, TeamClassLoaderFactory.Loader loader) throws Exception {
        ZipInputStream z = new ZipInputStream(TeamClassLoaderFactory.getFilesystemURL(url).openStream());

        while (true) {
            ZipEntry entry = z.getNextEntry();
            if (entry == null) break;
            String name = entry.getName();

            if (name.endsWith(".class")) {
                String className = name.substring(0, name.length()-6).replace("/",".");
                if (className.equals(rpName)) continue;
                loader.loadClass(className);
            }
        }
    }

    public static void checkFolder(String rpName, String folder, TeamClassLoaderFactory.Loader loader) throws Exception {
        Path root = Paths.get(folder);
        Files.walk(root).forEach((path) -> {
            String innerPath = root.relativize(path).toString();
            if (innerPath.endsWith(".class")) {
                String className = innerPath.substring(0, innerPath.length() - 6).replace("/", ".");
                if (className.equals(rpName)) return;
                try {
                    loader.loadClass(className);
                } catch (ClassNotFoundException e) {
                    throw new InstrumentationException(MISSING, "Couldn't load file, what?", e);
                }
            }
        });
    }
}
