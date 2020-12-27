package battlecode.world;

import battlecode.common.*;
import battlecode.schema.Action;
import battlecode.server.ErrorReporter;
import battlecode.server.GameMaker;
import battlecode.server.GameState;
import battlecode.world.control.RobotControlProvider;

import java.util.*;

/**
 * The primary implementation of the GameWorld interface for containing and
 * modifying the game map and the objects on it.
 */
public strictfp class GameWorld {
    /**
     * The current round we're running.
     */
    protected int currentRound;

    /**
     * Whether we're running.
     */
    protected boolean running = true;

    protected final IDGenerator idGenerator;
    protected final GameStats gameStats;
    
    private InternalRobot[][] robots;
    private final LiveMap gameMap;
    private final TeamInfo teamInfo;
    private final ObjectInfo objectInfo;

    private final RobotControlProvider controlProvider;
    private Random rand;

    private final GameMaker.MatchMaker matchMaker;

    @SuppressWarnings("unchecked")
    public GameWorld(LiveMap gm, RobotControlProvider cp, GameMaker.MatchMaker matchMaker) {
        this.robots = new InternalRobot[gm.getWidth()][gm.getHeight()]; // if represented in cartesian, should be height-width, but this should allow us to index x-y
        this.currentRound = 0;
        this.idGenerator = new IDGenerator(gm.getSeed());
        this.gameStats = new GameStats();

        this.gameMap = gm;
        this.objectInfo = new ObjectInfo(gm);
        this.teamInfo = new TeamInfo(this);

        this.controlProvider = cp;

        this.rand = new Random(this.gameMap.getSeed());

        this.matchMaker = matchMaker;

        controlProvider.matchStarted(this);

        // Add the robots contained in the LiveMap to this world.
        for(RobotInfo robot : this.gameMap.getInitialBodies()){
            spawnRobot(robot.ID, robot.type, robot.location, robot.team);
        }

        // Write match header at beginning of match
        this.matchMaker.makeMatchHeader(this.gameMap);
    }

    /**
     * Run a single round of the game.
     *
     * @return the state of the game after the round has run.
     */
    public synchronized GameState runRound() {
        if (!this.isRunning()) {
            // Write match footer if game is done
            matchMaker.makeMatchFooter(gameStats.getWinner(), currentRound);
            return GameState.DONE;
        }

        try {
            this.processBeginningOfRound();
            this.controlProvider.roundStarted();

            updateDynamicBodies();

            this.controlProvider.roundEnded();
            this.processEndOfRound();

            if (!this.isRunning()) {
                this.controlProvider.matchEnded();
            }

        } catch (Exception e) {
            ErrorReporter.report(e);
            // TODO throw out file?
            return GameState.DONE;
        }
        // Write out round data
        matchMaker.makeRound(currentRound);
        return GameState.RUNNING;
    }

    private void updateDynamicBodies(){
        objectInfo.eachDynamicBodyByExecOrder((body) -> {
            if (body instanceof InternalRobot) {
                return updateRobot((InternalRobot) body);
            }
            else {
                throw new RuntimeException("non-robot body registered as dynamic");
            }
        });
    }

    private boolean updateRobot(InternalRobot robot) {
        robot.processBeginningOfTurn();
        this.controlProvider.runRobot(robot);
        robot.setBytecodesUsed(this.controlProvider.getBytecodesUsed(robot));
        robot.processEndOfTurn();

        // If the robot terminates but the death signal has not yet
        // been visited:
        if (this.controlProvider.getTerminated(robot) && objectInfo.getRobotByID(robot.getID()) != null)
            destroyRobot(robot.getID());
        return true;
    }

    // *********************************
    // ****** BASIC MAP METHODS ********
    // *********************************

    public int getMapSeed() {
        return this.gameMap.getSeed();
    }

    public LiveMap getGameMap() {
        return this.gameMap;
    }

    public TeamInfo getTeamInfo() {
        return this.teamInfo;
    }

    public GameStats getGameStats() {
        return this.gameStats;
    }

    public ObjectInfo getObjectInfo() {
        return this.objectInfo;
    }

    public GameMaker.MatchMaker getMatchMaker() {
        return this.matchMaker;
    }

    public Team getWinner() {
        return this.gameStats.getWinner();
    }

    public boolean isRunning() {
        return this.running;
    }

    public int getCurrentRound() {
        return this.currentRound;
    }

    /**
     * Helper method that converts a location into an index.
     * 
     * @param loc the MapLocation
     */
    public int locationToIndex(MapLocation loc) {
        return loc.x - this.gameMap.getOrigin().x + (loc.y - this.gameMap.getOrigin().y) * this.gameMap.getWidth();
    }

    /**
     * Helper method that converts an index into a location.
     * 
     * @param idx the index
     */
    public MapLocation indexToLocation(int idx) {
        return new MapLocation(idx % this.gameMap.getWidth() + this.gameMap.getOrigin().x,
                               idx / this.gameMap.getWidth() + this.gameMap.getOrigin().y);
    }

    // For general methods, make sure to call
    // getMatchMaker().someMethod(parameters), e.g. getMatchMaker().addAction(robotID, action, targetID)
    // to make sure the needed info is updated for replay files

    // ***********************************
    // ****** ROBOT METHODS **************
    // ***********************************

    public InternalRobot getRobot(MapLocation loc) {
        return this.robots[loc.x][loc.y];
    }

    public void moveRobot(MapLocation start, MapLocation end) {
        addRobot(end, this.robots[start.x][start.y]);
        removeRobot(start);
    }

    public void addRobot(MapLocation loc, InternalRobot robot) {
        this.robots[loc.x][loc.y] = robot;
    }

    public void removeRobot(MapLocation loc) {
        this.robots[loc.x][loc.y] = null;
    }

    public InternalRobot[] getAllRobotsWithinRadiusSquared(MapLocation center, int radiusSquared) {
        ArrayList<InternalRobot> returnRobots = new ArrayList<InternalRobot>();
        for (MapLocation newLocation : getAllLocationsWithinRadiusSquared(center, radiusSquared))
            if (this.robots[newLocation.x][newLocation.y] != null)
                returnRobots.add(this.robots[newLocation.x][newLocation.y]);
        return returnRobots.toArray(new InternalRobot[returnRobots.size()]);
    }

    public MapLocation[] getAllLocationsWithinRadiusSquared(MapLocation center, int radiusSquared) {
        ArrayList<MapLocation> returnLocations = new ArrayList<MapLocation>();
        int ceiledRadius = (int) Math.ceil(Math.sqrt(radiusSquared)) + 1; // add +1 just to be safe
        int minX = Math.max(center.x - ceiledRadius, 0);
        int minY = Math.max(center.y - ceiledRadius, 0);
        int maxX = Math.min(center.x + ceiledRadius, this.gameMap.getWidth() - 1);
        int maxY = Math.min(center.y + ceiledRadius, this.gameMap.getHeight() - 1);
        for (int x = minX; x <= maxX; x++) {
            for (int y = minY; y <= maxY; y++) {
                MapLocation newLocation = new MapLocation(x, y);
                if (center.isWithinDistanceSquared(newLocation, radiusSquared))
                    returnLocations.add(newLocation);
            }
        }
        return returnLocations.toArray(new MapLocation[0]);
    }

    // *********************************
    // ****** GAMEPLAY *****************
    // *********************************

    public void processBeginningOfRound() {
        // Increment round counter
        currentRound++;

        // Process beginning of each robot's round
        objectInfo.eachRobot((robot) -> {
            robot.processBeginningOfRound();
            return true;
        });
    }

    public void setWinner(Team t, DominationFactor d)  {
        gameStats.setWinner(t);
        gameStats.setDominationFactor(d);
    }

    // Here, we want to have a series of setWinnerIfSomeCondition() methods.
    // As it sounds, we check some condition, then either call
    // setWinner(Team.A, DominationFactor.SOME_FACTOR) and return true
    // or return false

    /**
     * Sets the winner if one of the teams has more robots than the other.
     *
     * @return whether or not a winner was set
     */
    public boolean setWinnerIfQuantity() {
        int robotCountA = objectInfo.getRobotCount(Team.A);
        int robotCountB = objectInfo.getRobotCount(Team.B);
        if (robotCountA == 0 && robotCountB > 0) {
            setWinner(Team.B, DominationFactor.QUANTITY_OVER_QUALITY);
            return true;
        } else if (robotCountB == 0 && robotCountA > 0) {
            setWinner(Team.A, DominationFactor.QUANTITY_OVER_QUALITY);
            return true;
        }
        return false;
    }

    /**
     * Sets the winner if one of the teams has higher net worth
     *  (soup + soup cost of robots).
     *
     * @return whether or not a winner was set
     */
    public boolean setWinnerIfQuality() {
        int[] netWorths = new int[2];
        netWorths[0] = 0; // used to be Team.A's soup
        netWorths[1] = 0; // used to be Team.B's soup
        for (InternalRobot robot : objectInfo.robotsArray()) {
            if (robot.getTeam() == Team.NEUTRAL) continue;
            netWorths[robot.getTeam().ordinal()] += robot.getType().cost;
        }
        if (netWorths[0] > netWorths[1]) {
            setWinner(Team.A, DominationFactor.QUALITY_OVER_QUANTITY);
            return true;
        } else if (netWorths[1] > netWorths[0]) {
            setWinner(Team.B, DominationFactor.QUALITY_OVER_QUANTITY);
            return true;
        }
        return false;
    }

    /**
     * Sets winner based on highest robot id.
     */
    public boolean setWinnerHighestRobotID() {
        InternalRobot highestIDRobot = null;
        for (InternalRobot robot : objectInfo.robotsArray())
            if ((highestIDRobot == null || robot.getID() > highestIDRobot.getID()) && robot.getTeam() != Team.NEUTRAL)
                highestIDRobot = robot;
        if (highestIDRobot == null)
            return false;
        setWinner(highestIDRobot.getTeam(), DominationFactor.HIGHBORN);
        return true;
    }

    /**
     * Sets a winner arbitrarily. Hopefully this is actually random.
     */
    public void setWinnerArbitrary() {
        setWinner(Math.random() < 0.5 ? Team.A : Team.B, DominationFactor.WON_BY_DUBIOUS_REASONS);
    }

    public boolean timeLimitReached() {
        return currentRound >= this.gameMap.getRounds() - 1;
    }


    public void processEndOfRound() {
        // Process end of each robot's round
        objectInfo.eachRobot((robot) -> {
            robot.processEndOfRound();
            return true;
        });

        // Check for end of match
        // occurs when time limit reached
        if (timeLimitReached() && gameStats.getWinner() == null)
            if (!setWinnerIfQuantity())
                if (!setWinnerIfQuality())
                    if (!setWinnerHighestRobotID())
                        setWinnerArbitrary();

        // TODO: update the round statistics, i.e. add team soup/set global pollution

        if (gameStats.getWinner() != null)
            running = false;
    }

    // *********************************
    // ****** SPAWNING *****************
    // *********************************

    public int spawnRobot(int ID, RobotType type, MapLocation location, Team team){
        InternalRobot robot = new InternalRobot(this, ID, type, location, team);
        objectInfo.spawnRobot(robot);
        addRobot(location, robot);

        controlProvider.robotSpawned(robot);
        matchMaker.addSpawnedRobot(robot);
        return ID;
    }

    public int spawnRobot(RobotType type, MapLocation location, Team team){
        int ID = idGenerator.nextID();
        return spawnRobot(ID, type, location, team);
    }
   
    // *********************************
    // ****** DESTROYING ***************
    // *********************************

    public void destroyRobot(int id) {
        InternalRobot robot = objectInfo.getRobotByID(id);
        removeRobot(robot.getLocation());

        // TODO: take care of things that happen when robot dies

        controlProvider.robotKilled(robot);
        objectInfo.destroyRobot(id);

        matchMaker.addDied(id);
    }
}


