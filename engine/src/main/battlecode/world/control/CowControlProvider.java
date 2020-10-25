package battlecode.world.control;

import battlecode.common.*;
import battlecode.server.ErrorReporter;
import battlecode.server.Server;
import battlecode.world.GameWorld;
import battlecode.world.InternalRobot;

import java.util.*;

public class CowControlProvider implements RobotControlProvider {

    /**
     * The directions a cow cares about.
     */
    private final Direction[] DIRECTIONS = {
        Direction.NORTH,
        Direction.NORTHEAST,
        Direction.EAST,
        Direction.SOUTHEAST,
        Direction.SOUTH,
        Direction.SOUTHWEST,
        Direction.WEST,
        Direction.NORTHWEST
    };

    /**
     * The types & order to spawn cows in.
     */
    private final RobotType COW_TYPE = RobotType.COW;

    /**
     * The world we're operating in.
     */
    private GameWorld world;

    private enum MapSymmetry {rotational, horizontal, vertical};

    /**
     * The symmetry of the world.
     */
    private MapSymmetry s;

    private HashMap<Integer, Random> idToRandom = new HashMap<Integer, Random>();


    /**
     * Create a CowControlProvider.
     */
    public CowControlProvider() {
    }

    @Override
    public void matchStarted(GameWorld world) {
        assert this.world == null;

        this.world = world;
        this.s = getSymmetry();
        // clear out the idToRandom
        // note that the control provider isn't reset on every game, so this is necessary
        idToRandom.clear();
        //System.out.println("symmetry is " + this.s + "!!!");
    }

    @Override
    public void matchEnded() {
        assert this.world != null;

        this.world = null;
    }

    @Override
    public void roundStarted() {}

    @Override
    public void roundEnded() {}

    @Override
    public void robotSpawned(InternalRobot robot) {
        // we should update symmetry here. this ensures we account for all robots as well.
        // we here use the convention that HQs are added before cows
        this.s = getSymmetry();
    }

    @Override
    public void robotKilled(InternalRobot robot) {}

    @Override
    public void runRobot(InternalRobot robot) {
        if (robot.getType() == COW_TYPE) {
            processCow(robot);
        } else {
            // We're somehow controlling a non-cow robot.
            // ...
            // just do nothing lol, this will never happen
        }
    }

    private void processCow(InternalRobot cow) {
        assert cow.getType() == COW_TYPE;
        final RobotController rc = cow.getController();

        try {
            if (!idToRandom.containsKey(cow.getID())) {
                Random newRandom = new Random(84307 * world.getMapSeed() + 20201 * (cow.getID() / 2));
//                System.out.println("random seed: " + (84307*world.getMapSeed() + 20201*(cow.getID() / 2)));
                idToRandom.put(cow.getID(), newRandom);
            }
            int i = 4;
            Random random = idToRandom.get(cow.getID());
            if (rc.isReady()) {
                while (i-->0) {
                    Direction dir = DIRECTIONS[(int) Math.floor(random.nextDouble() * (double) DIRECTIONS.length)];
//                    System.out.println("round: " + world.getCurrentRound() + "id: " + cow.getID() + "dir: " + dir);
                    MapLocation loc = cow.getLocation();
                    if (cow.getID() % 2 == 1) dir = reverseDirection(dir);
//                    System.out.println("final dir: " + dir);
                    if (rc.canMove(dir) && !world.isFlooded(rc.adjacentLocation(dir))) {
                        rc.move(dir);
                        break;
                    }
                }
                return;
            }
            // make sure we always call random.nextDouble four times
            while (i-->0)
                random.nextDouble();
        } catch (Exception e) {
            ErrorReporter.report(e, true);
        }
    }

    private Direction reverseDirection(Direction dir) {
        switch (s) {
            case horizontal:
                if (dir == Direction.NORTHEAST) return Direction.SOUTHEAST;
                if (dir == Direction.SOUTHEAST) return Direction.NORTHEAST;
                if (dir == Direction.NORTH) return Direction.SOUTH;
                if (dir == Direction.SOUTH) return Direction.NORTH;
                if (dir == Direction.NORTHWEST) return Direction.SOUTHWEST;
                if (dir == Direction.SOUTHWEST) return Direction.NORTHWEST;
                return dir;
            case vertical:
                if (dir == Direction.NORTHEAST) return Direction.NORTHWEST;
                if (dir == Direction.SOUTHEAST) return Direction.SOUTHWEST;
                if (dir == Direction.NORTHWEST) return Direction.NORTHEAST;
                if (dir == Direction.SOUTHWEST) return Direction.SOUTHEAST;
                if (dir == Direction.WEST) return Direction.EAST;
                if (dir == Direction.EAST) return Direction.WEST;
                return dir;
            case rotational:
                return dir.opposite();
            default:
                return dir;
        }
    }

    private MapSymmetry getSymmetry() {

        ArrayList<MapSymmetry> possible = new ArrayList<MapSymmetry>();
        possible.add(MapSymmetry.vertical); 
        possible.add(MapSymmetry.horizontal);
        possible.add(MapSymmetry.rotational);

        for (int x = 0; x < world.getGameMap().getWidth(); x++) {
            for (int y = 0; y < world.getGameMap().getHeight(); y++) {
                MapLocation current = new MapLocation(x, y);
                InternalRobot bot = world.getRobot(current);
                RobotInfo cri = null;
                if(bot != null)
                    cri = bot.getRobotInfo();
                for (int i = possible.size()-1; i >= 0; i--) { // iterating backwards so we can remove in the loop
                    MapSymmetry symmetry = possible.get(i);
                    MapLocation symm = new MapLocation(symmetricX(x, symmetry), symmetricY(y, symmetry));
                    if (world.getSoup(current) != world.getSoup(symm)) possible.remove(symmetry);
                    if (world.getDirt(current) != world.getDirt(symm)) possible.remove(symmetry);
                    bot = world.getRobot(symm);
                    RobotInfo sri = null;  
                    if (bot != null) sri = bot.getRobotInfo();
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

        if (possible.size() > 0)
            return possible.get(0);
        return MapSymmetry.rotational;
    }

    public int symmetricY(int y, MapSymmetry symmetry) {
        switch (symmetry) {
            case vertical:
                return y;
            case horizontal:
            case rotational:
            default:
                return world.getGameMap().getHeight() - 1 - y;
        }
    }

    public int symmetricX(int x, MapSymmetry symmetry) {
        switch (symmetry) {
            case horizontal:
                return x;
            case vertical:
            case rotational:
            default:
                return world.getGameMap().getWidth() - 1 - x;
        }
    }

    @Override
    public int getBytecodesUsed(InternalRobot robot) {
        // Cows don't think.
        return 0;
    }

    @Override
    public boolean getTerminated(InternalRobot robot) {
        // Cows never terminate due to computation errors.
        return false;
    }
}