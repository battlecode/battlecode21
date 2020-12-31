package battlecode.world;

import battlecode.common.*;

import java.io.File;
import java.io.IOException;
import java.util.*;

/**
 * Build and validate maps easily.
 */
public class MapBuilder {

    public enum MapSymmetry {rotational, horizontal, vertical};

    public String name;
    public int width;
    public int height;
    public int seed;
    private MapSymmetry symmetry;
    private double[] passabilityArray;
    private int idCounter;

    private List<RobotInfo> bodies;

    public MapBuilder(String name, int width, int height, int seed) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.seed = seed;
        this.bodies = new ArrayList<>();

        // default values
        this.symmetry = MapSymmetry.vertical;
        this.waterLevel = 0;
        this.idCounter = 0;
        this.passabilityArray = new double[width*height];
        for (int i = 0; i < passabilityArray.length; i++) {
            passabilityArray[i] = 1; // default cooldown factor is 1
        }
    }

    // ********************
    // BASIC METHODS
    // ********************

    /**
     * Convert location to index. Critical: must conform with GameWorld.indexToLocation.
     * @param x
     * @param y
     * @return
     */
    private int locationToIndex(int x, int y) {
        return x + y * width;
    }

    public void addEnlightenmentCenter(int id, Team team, int influence, MapLocation loc){
        // check if something already exists here, if so shout
        for (RobotInfo r : bodies) {
            if (r.location.equals(loc)) {
                throw new RuntimeException("CANNOT ADD ROBOT TO SAME LOCATION AS OTHER ROBOT");
            }
        }
        bodies.add(new RobotInfo(
                id,
                team,
                RobotType.ENLIGHTENMENT_CENTER,
                influence,
                influence, // Enlightenment Centers conviction == influence
                loc
        ));
    }

    public void addEnlightenmentCenter(int x, int y, Team team, int influence) {
        addEnlightenmentCenter(
                idCounter++,
                team,
                influence,
                new MapLocation(x, y)
        );
    }

    public void setPassability(int x, int y, double value) {
        this.passabilityArray[locationToIndex(x, y)] = value;
    }

    public void setSymmetry(MapSymmetry symmetry) {
        this.symmetry = symmetry;
    }


    // ********************
    // SYMMETRY METHODS
    // ********************

    public int symmetricY(int y) {
        return symmetricY(y, symmetry);
    }

    public int symmetricX(int x) {
        return symmetricX(x, symmetry);
    }
    public int symmetricY(int y, MapSymmetry symmetry) {
        switch (symmetry) {
            case vertical:
                return y;
            case horizontal:
            case rotational:
            default:
                return height - 1 - y;
        }
    }

    public int symmetricX(int x, MapSymmetry symmetry) {
        switch (symmetry) {
            case horizontal:
                return x;
            case vertical:
            case rotational:
            default:
                return width - 1 - x;
        }
    }

    public MapLocation symmetryLocation(MapLocation p) {
        return new MapLocation(symmetricX(p.x), symmetricY(p.y));
    }

    /**
     * Add team A Enlightenment Center to (x,y) and team B Enlightenment Center to symmetric position.
     * @param x x position
     * @param y y position
     */
    public void addSymmetricEnlightenmentCenter(int x, int y) {
        addEnlightenmentCenter(x, y, Team.A, GameConstants.INITIAL_ENLIGHTENMENT_CENTER_INFLUENCE);
        addEnlightenmentCenter(symmetricX(x), symmetricY(y), Team.B, GameConstants.INITIAL_ENLIGHTENMENT_CENTER_INFLUENCE);
    }

    public void addSymmetricNeutralEnlightenmentCenter(int x, int y, int influence) {
        addEnlightenmentCenter(x, y, Team.NEUTRAL, influence);
        addEnlightenmentCenter(symmetricX(x), symmetricY(y), Team.NEUTRAL, influence);
    }

    public void setSymmetricPassability(int x, int y, double value) {
        this.passabilityArray[locationToIndex(x, y)] = value;
        this.passabilityArray[locationToIndex(symmetricX(x), symmetricY(y))] = value;
    }

    // ********************
    // BUILDING AND SAVING
    // ********************

    public LiveMap build() {
        return new LiveMap(width, height, new MapLocation(0, 0), seed, GameConstants.GAME_MAX_NUMBER_OF_ROUNDS, name,
                bodies.toArray(new RobotInfo[bodies.size()]), passabilityArray);
    }

    /**
     * Saves the map to the specified location.
     * @param pathname
     * @throws IOException
     */
    public void saveMap(String pathname) throws IOException {
        // validate
        assertIsValid();
        System.out.println("Saving " + this.name + ": has " + Integer.toString(getTotalSoup())+ " total soup.");
        GameMapIO.writeMap(this.build(), new File(pathname));
    }

    /**
     * Returns true if the map is valid.
     *
     * WARNING: DON'T TRUST THIS COMPLETELY. THIS DOES NOT VERIFY SYMMETRY.
     * @return
     */
    public void assertIsValid() {

        System.out.println("Validating " + name + "...");

        // get robots
        RobotInfo[] robots = new RobotInfo[width*height];
        for (RobotInfo r : bodies) {
            assert robots[locationToIndex(r.location.x, r.location.y)] == null;
            robots[locationToIndex(r.location.x, r.location.y)] = r;
        }


        if (width < 32 || height < 32 || width > 64 || height > 64)
            throw new RuntimeException("The map size must be between 32x32 and 64x64, inclusive.");

        // checks at least one Enlightenment Center of each team
        // only needs to check there's an Enlightenment Center of Team A, because symmetry is checked
        boolean noTeamARobots = true;
        for (RobotInfo r : bodies) {
            if (r.getTeam() == Team.A) {
                noTeamARobots = false;
                break;
            }
        }
        if (noTeamARobots) {
            throw new RuntimeException("Map must have starting robots of each team");
        }

        // assert passability and Enlightenment Center symmetry
        ArrayList<MapSymmetry> allMapSymmetries = getSymmetry(robots);
        System.out.println("This map has the following symmetries: " + allMapSymmetries);
        boolean doesContain = false;
        for (MapSymmetry sss : allMapSymmetries) {
            if (sss == symmetry) doesContain = true;
        }
        if (!doesContain) {
            throw new RuntimeException("Passability and Enlightenment Centers must be symmetric according to the given symmetry; they are not currently.");
        }
    }

    public boolean onTheMap(MapLocation loc) {
        return loc.x >= 0 && loc.y >= 0 && loc.x < width && loc.y < height;
    }

    public MapLocation indexToLocation(int idx) {
        return new MapLocation(idx % this.width,
                               idx / this.width);
    }

    private ArrayList<MapSymmetry> getSymmetry(RobotInfo[] robots) {

        ArrayList<MapSymmetry> possible = new ArrayList<MapSymmetry>();
        possible.add(MapSymmetry.vertical);
        possible.add(MapSymmetry.horizontal);
        possible.add(MapSymmetry.rotational);

        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                MapLocation current = new MapLocation(x, y);
                RobotInfo cri = robots[locationToIndex(current.x, current.y)];
                for (int i = possible.size()-1; i >= 0; i--) { // iterating backwards so we can remove in the loop
                    MapSymmetry symmetry = possible.get(i);
                    MapLocation symm = new MapLocation(symmetricX(x, symmetry), symmetricY(y, symmetry));
                    if (passabilityArray[locationToIndex(current.x, current.y)] != passabilityArray[locationToIndex(symm.x, symm.y)]) possible.remove(symmetry);
                    RobotInfo sri = robots[locationToIndex(symm.x, symm.y)];
                    if (!(cri == null) || !(sri == null)) {
                        if (cri == null || sri == null) {
                            possible.remove(symmetry);
                        } else if (cri.getType() != sri.getType()) {
                            possible.remove(symmetry);
                        } else if (!symmetricTeams(cri.getTeam(), sri.getTeam())) {
                            possible.remove(symmetry);
                        }
                    }
                }
                if (possible.size() <= 1) break;
            }
            if (possible.size() <= 1) break;
        }

        return possible;
    }

    private boolean symmetricTeams(Team a, Team b) {
        switch (a) {
            case Team.A: return b == Team.B;
            case Team.B: return b == Team.A;
            default: return b == Team.NEUTRAL;
        }
    }
}
