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
    private int[] soupArray;
    private int[] pollutionArray;
    private boolean[] waterArray;
    private int[] dirtArray;
    private int waterLevel;
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
        this.soupArray = new int[width*height];
        this.pollutionArray = new int[width*height];
        this.waterArray = new boolean[width*height];
        this.dirtArray = new int[width*height];
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

    public void addRobot(int id, Team team, RobotType type, MapLocation loc){
        // check if something already exists here, if so shout
        for (RobotInfo r : bodies) {
            if (r.location.equals(loc)) {
                throw new RuntimeException("CANNOT ADD ROBOT TO SAME LOCATION AS OTHER ROBOT");
            }
        }
        bodies.add(new RobotInfo(
                id,
                team,
                type,
                loc
        ));
    }

    public void addHQ(int x, int y, Team team) {
        addRobot(
                idCounter++,
                team,
                RobotType.HQ,
                new MapLocation(x, y)
        );
    }

    public void addCow(int x, int y) {
        addRobot(
                idCounter++,
                Team.NEUTRAL,
                RobotType.COW,
                new MapLocation(x, y)
        );
    }

    public void setSoup(int x, int y, int value) {
        this.soupArray[locationToIndex(x, y)] = value;
    }

    public void setPollution(int x, int y, int value) {
        this.pollutionArray[locationToIndex(x, y)] = value;
    }

    public void setWater(int x, int y, boolean value) {
        this.waterArray[locationToIndex(x, y)] = value;
    }

    public void setDirt(int x, int y, int value) {
        this.dirtArray[locationToIndex(x, y)] = value;
    }

    // The water level should always be set to 0!!
    public void setWaterLevel(int waterLevel) {
        this.waterLevel = waterLevel;
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
     * Add team A HQ to (x,y) and team B HQ to symmetric position.
     * @param x x position
     * @param y y position
     */
    public void addSymmetricHQ(int x, int y) {
        addHQ(x, y, Team.A);
        addHQ(symmetricX(x), symmetricY(y), Team.B);
    }

    public void addSymmetricCow(int x, int y) {
        addCow(x, y);
        addCow(symmetricX(x), symmetricY(y));
    }

    public void setSymmetricSoup(int x, int y, int value) {
        this.soupArray[locationToIndex(x, y)] = value;
        this.soupArray[locationToIndex(symmetricX(x), symmetricY(y))] = value;
    }

    public void setSymmetricPollution(int x, int y, int value) {
        this.pollutionArray[locationToIndex(symmetricX(x), symmetricY(y))] = value;
    }

    public void setSymmetricWater(int x, int y, boolean value) {
        this.waterArray[locationToIndex(x, y)] = value;
        this.waterArray[locationToIndex(symmetricX(x), symmetricY(y))] = value;
    }

    public void setSymmetricDirt(int x, int y, int value) {
        this.dirtArray[locationToIndex(x, y)] = value;
        this.dirtArray[locationToIndex(symmetricX(x), symmetricY(y))] = value;
    }


//    public void addRectangleDirt(int xl, int yb, int xr, int yt, int v) {
//        for (int i = xl; i < xr+1; i++) {
//            for (int j = yb; j < yt+1; j++) {
//                setSymmetricDirt(i, j, v);
//            }
//        }
//    }
//
//    public void addRectangleWater(int xl, int yb, int xr, int yt, int v) {
//        for (int i = xl; i < xr+1; i++) {
//            for (int j = yb; j < yt+1; j++) {
//                setSymmetricWater(i, j, true);
//                setSymmetricDirt(i,j, v);
//            }
//        }
//        setSymmetricDirt((xl + xr)/2, (yb + yt)/2, Integer.MIN_VALUE);
//    }
//    public void addRectangleSoup(int xl, int yb, int xr, int yt, int v) {
//        for (int i = xl; i < xr+1; i++) {
//            for (int j = yb; j < yt+1; j++) {
//                setSymmetricSoup(i, j, v);
//            }
//        }
//    }
//
//
//    /*
//     * Add a nice circular lake centered at (x,y).
//     */
//    public static void addSoup(int x, int y, int r2, int v) {
//        for (int xx = 0; xx < width; xx++) {
//            for (int yy = 0; yy < height; yy++) {
//                int d = (xx-x)*(xx-x)/2 + (yy-y)*(yy-y);
//                if (d <= r2) {
//                    setSymmetricSoup(xx, yy, v*(d+v));
//                }
//            }
//        }
//    }
//
//    /*
//     * Add a nice circular lake centered at (x,y).
//     */
//    public static void addLake(int x, int y, int r2, int v) {
//        for (int xx = 0; xx < width; xx++) {
//            for (int yy = 0; yy < height; yy++) {
//                int d = (xx-x)*(xx-x) + (yy-y)*(yy-y);
//                if (d <= r2) {
//                    setSymmetricWater(xx, yy, true);
//                    setSymmetricDirt(xx, yy, v);
//                }
//            }
//        }
//    }

    // ********************
    // INFORMATION
    // ********************

    public int getTotalSoup() {
        int tot = 0;
        for (int x = 0; x < width; x++)
            for (int y=0;y<height;y++)
                tot += this.soupArray[locationToIndex(x,y)];
        return tot;
    }

    // ********************
    // BUILDING AND SAVING
    // ********************


    public LiveMap build() {
        return new LiveMap(width, height, new MapLocation(0, 0), seed, GameConstants.GAME_MAX_NUMBER_OF_ROUNDS, name,
                bodies.toArray(new RobotInfo[bodies.size()]), soupArray, pollutionArray, waterArray, dirtArray, waterLevel);
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

        // check HQ effective elevation (floods between 1 and 5)
        ArrayList<MapLocation> HQLocations = new ArrayList<MapLocation>();
        for (RobotInfo r : bodies) {
            if (r.getType() == RobotType.HQ) {
                HQLocations.add(r.getLocation());
            }
        }
        for (int waterLevel = 0; waterLevel < 6; waterLevel++) {
            boolean[] waterTestArray = waterArray.clone();
            Queue<Integer> q = new LinkedList<Integer>();
            for (int x = 0; x < width; x++)
                for (int y = 0; y < height; y++)
                    if (waterArray[locationToIndex(x,y)])
                        q.add(locationToIndex(x,y));
            while (!q.isEmpty()) {
                Integer f = q.poll();
                for (Direction d : Direction.allDirections()) {
                    if (!onTheMap(indexToLocation(f).add(d)))
                        continue;
                    int dd = locationToIndex(indexToLocation(f).add(d).x, indexToLocation(f).add(d).y);
                    if (dirtArray[dd] > waterLevel)
                        continue;
                    if (!waterTestArray[dd]) {
                        waterTestArray[dd] = true;
                        q.add(dd);
                    }
                }
            }
            for (MapLocation HQLoc : HQLocations) {
                if (waterLevel <= 1 && waterTestArray[locationToIndex(HQLoc.x, HQLoc.y)]) {
                    throw new RuntimeException("The HQ must not flood at an effective elevation of 1! It currently floods at 0 or 1.");
                }
                if (waterLevel == 5 && !waterTestArray[locationToIndex(HQLoc.x, HQLoc.y)]) {
                    throw new RuntimeException("The HQ must not flood at an effective elevation between 2-5! It currently does not flood at 5.");
                }
            }
        }

        // HQ will not start adjacent to deep water
        // here we define deep water to be -10
        for (MapLocation HQLoc : HQLocations) {
            for (int x = 0; x < width; x++)
                for (int y=0; y < height; y++) {
                    if (HQLoc.isAdjacentTo(new MapLocation(x,y)) && waterArray[locationToIndex(x,y)] && dirtArray[locationToIndex(x,y)] < -10) {
                        throw new RuntimeException("HQ may not start next to water that has elevation < -10 (position (" + x + "," + y + ")");
                    }
                }
        }

        // HQ cannot be covered in water
        for (MapLocation HQLoc : HQLocations) {
            if (waterArray[locationToIndex(HQLoc.x, HQLoc.y)])
                throw new RuntimeException("HQ may not be flooded at the start; but location " + HQLoc + " is.");
        }

        // assert soup and dirt symmetry
        ArrayList<MapSymmetry> allMapSymmetries = getSymmetry(robots);
        System.out.println("This map has the following symmetries: " + allMapSymmetries);
        boolean doesContain = false;
        for (MapSymmetry sss : allMapSymmetries) {
            if (sss == symmetry) doesContain = true;
        }
        if (!doesContain) {
            throw new RuntimeException("Soup, dirt and robots must be symmetric according to the given symmetry; they are not currently.");
        }

        // Corresponding cows must have IDs 2,3; 4,5; 6,7; etc
        for (RobotInfo r : bodies) {
            if (r.getType() == RobotType.COW) {
                MapLocation s = symmetryLocation(r.location);
                RobotInfo cr = robots[locationToIndex(s.x, s.y)];
                if (cr.getType() != RobotType.COW)
                    throw new RuntimeException("This should never happen, check getSymmetry function for correctness.");
                if (cr.getID() / 2 != r.getID() / 2)
                    throw new RuntimeException("Corresponding cows must have IDs that are the same / 2.");
            }
        }


        // check if there is a -inf water tile
        // note: we don't want to use Integer.MIN_VALUE because we then risk underflow
        // we can never build higher than this
        // A good option is Integer.MIN_VALUE / 2.
        int impossibleHeight = 10000000;
        boolean hasMinInfWater = false;
        for (int x = 0; x < width; x++)
            for (int y=0; y < height; y++)
                if (waterArray[locationToIndex(x,y)] && dirtArray[locationToIndex(x,y)] == GameConstants.MIN_WATER_ELEVATION) {
                    hasMinInfWater = true;
                }
        if (!hasMinInfWater)
            throw new RuntimeException("Every map is required to have a water tile with elevation GameConstants.MIN_WATER_ELEVATION. This map does not have that.");

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
                    if (soupArray[locationToIndex(current.x, current.y)] != soupArray[locationToIndex(symm.x, symm.y)]) possible.remove(symmetry);
                    if (dirtArray[locationToIndex(current.x, current.y)] != dirtArray[locationToIndex(symm.x, symm.y)]) possible.remove(symmetry);
                    RobotInfo sri = robots[locationToIndex(symm.x, symm.y)];
                    if (!(cri == null) || !(sri == null)) {
                        if (cri == null || sri == null) {
                            possible.remove(symmetry);
                        } else if (cri.getType() != sri.getType()) {
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
}
