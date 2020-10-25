package battlecode.server;

import java.io.File;
import java.io.FileFilter;
import java.io.IOException;
import java.util.*;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.zip.ZipEntry;

// TODO: read default map paths from config file
// TODO: remove the dependency on Server

/**
 * A utility class for finding the two types match inputs (teams and maps) that
 * are available either locally or on a remote machine. It searches the Java
 * classpath and a set of map paths for elements.
 * <p/>
 * Note that this class only matches files by name, so it's possible for it to
 * return invalid map files, for instance, so long as they are named like map
 * files.
 */
public class PlayerFinder {

    /**
     * The filters used to find teams and maps.
     */
    private final Filter teamFilter;

    /**
     * The paths for finding teams and maps.
     */
    private final String[] classPaths;

    /**
     * A file filter that passes directories (to propagate a directory search)
     * and class files that seem to be BattleCode players.
     */
    private interface Filter extends FileFilter {
        boolean accept(ZipEntry pathname);
    }

    private static class TeamFileFilter implements Filter {
        public boolean accept(File pathname) {
            return pathname.isDirectory() || "RobotPlayer.class".equals(pathname.getName());
        }

        public boolean accept(ZipEntry pathname) {
            return pathname.getName().endsWith("/RobotPlayer.class");
        }
    }

    /**
     * Constructs a PlayerFinder that searches the Java classpath.
     */
    public PlayerFinder() {
        this.classPaths = System.getProperty("java.class.path").split(File.pathSeparator);

        // Construct the file filters.
        teamFilter = new TeamFileFilter();
    }

    /**
     * Finds maps and teams on the local machine using the Java classpath and
     * map paths.
     *
     * @return an array of String arrays, where element 0 is an array of
     *         team names and element 1 is an array of map names
     */
    public String[] findMatchInputsLocally() {
        return findResourcesLocally(classPaths, teamFilter, true);
    }

    /**
     * A generic directory search over a set of paths using a file filter that
     * returns an array of matching names.
     *
     * @param paths  the set of paths to search
     * @param filter the filter to use while searching
     * @param parent whether or not to add the immediate parent directory when
     *               searching
     * @return a String array containing the matched file's names
     */
    private String[] findResourcesLocally(String[] paths, Filter filter, boolean parent) {

        List<String> foundList = new LinkedList<>();

        for (String path : paths) {
            File f = new File(path);
            if (f.isDirectory())
                searchPath(f, foundList, filter, parent);
            else if (f.getName().endsWith(".jar"))
                searchJar(f, foundList, filter);
        }

        // Convert to an array and return.
        return foundList.toArray(new String[foundList.size()]);
    }

    /**
     * Searches the given directory, adding to the given list of matches made
     * by the given filter. This method will recurse on directories it
     * encounters until it has searched the entire tree.
     *
     * @param dir    the directory to search
     * @param found  the list to which matching file names are added
     * @param filter the name of the filter to use
     * @param parent whether or not to add the parent directories of matching
     *               files to the found list
     */
    private void searchPath(File dir, List<String> found, FileFilter filter, boolean parent) {
        // Stop if it's not a directory.
        if (!dir.isDirectory())
            return;

        for (File f : dir.listFiles(filter)) {
            if (f.isDirectory())
                searchPath(f, found, filter, parent);
            else if (parent)
                found.add(f.getParentFile().getName());
            else
                found.add(f.getName());
        }
    }

    /**
     * Search a jar file.
     *
     * @param j the jar file
     * @param found the list to append found files to
     * @param filter the filter to use to filter entries
     */
    private void searchJar(File j, List<String> found, Filter filter) {
        try {
            JarFile jar = new JarFile(j);
            Enumeration<JarEntry> en = jar.entries();
            while (en.hasMoreElements()) {
                ZipEntry e = en.nextElement();
                if (filter.accept(e)) {
                    String name = e.getName();
                    int end = name.lastIndexOf('/');
                    int start = name.lastIndexOf('/', end - 1) + 1;
                    found.add(name.substring(start, end - start));
                }
            }
        } catch (IOException e) {
        }
    }

}
