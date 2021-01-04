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
    
    private double[] passability;
    private InternalRobot[][] robots;
    private final LiveMap gameMap;
    private final TeamInfo teamInfo;
    private final ObjectInfo objectInfo;

    private final RobotControlProvider controlProvider;
    private Random rand;
    private final GameMaker.MatchMaker matchMaker;

    private int[] buffsToAdd;

    @SuppressWarnings("unchecked")
    public GameWorld(LiveMap gm, RobotControlProvider cp, GameMaker.MatchMaker matchMaker) {
        this.passability = gm.getPassabilityArray();
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

        this.buffsToAdd = new int[2];

        controlProvider.matchStarted(this);

        // Add the robots contained in the LiveMap to this world.
        RobotInfo[] initialBodies = this.gameMap.getInitialBodies();
        for (int i = 0; i < initialBodies.length; i++) {
            RobotInfo robot = initialBodies[i];
            MapLocation newLocation = robot.location.translate(gm.getOrigin().x, gm.getOrigin().y);
            int newID = spawnRobot(null, robot.type, newLocation, robot.team, robot.influence);
            initialBodies[i] = new RobotInfo(newID, robot.team, robot.type, robot.influence, robot.conviction, newLocation); // update with non-deterministic ID and offset location
            // System.out.println("robot influence: " + robot.influence);
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
            //destroyRobot(robot.getID());
            ; // Freeze robot instead of destroying it
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

    public double getPassability(MapLocation loc) {
        return this.passability[locationToIndex(loc)];
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

    // ***********************************
    // ****** ROBOT METHODS **************
    // ***********************************

    public InternalRobot getRobot(MapLocation loc) {
        return this.robots[loc.x - this.gameMap.getOrigin().x][loc.y - this.gameMap.getOrigin().y];
    }

    public void moveRobot(MapLocation start, MapLocation end) {
        addRobot(end, getRobot(start));
        removeRobot(start);
    }

    public void addRobot(MapLocation loc, InternalRobot robot) {
        this.robots[loc.x - this.gameMap.getOrigin().x][loc.y - this.gameMap.getOrigin().y] = robot;
    }

    public void removeRobot(MapLocation loc) {
        this.robots[loc.x - this.gameMap.getOrigin().x][loc.y - this.gameMap.getOrigin().y] = null;
    }

    public InternalRobot[] getAllRobotsWithinRadiusSquared(MapLocation center, int radiusSquared) {
        ArrayList<InternalRobot> returnRobots = new ArrayList<InternalRobot>();
        for (MapLocation newLocation : getAllLocationsWithinRadiusSquared(center, radiusSquared))
            if (getRobot(newLocation) != null)
                returnRobots.add(getRobot(newLocation));
        return returnRobots.toArray(new InternalRobot[returnRobots.size()]);
    }

    public MapLocation[] getAllLocationsWithinRadiusSquared(MapLocation center, int radiusSquared) {
        ArrayList<MapLocation> returnLocations = new ArrayList<MapLocation>();
        int ceiledRadius = (int) Math.ceil(Math.sqrt(radiusSquared)) + 1; // add +1 just to be safe
        int minX = Math.max(center.x - ceiledRadius, this.gameMap.getOrigin().x);
        int minY = Math.max(center.y - ceiledRadius, this.gameMap.getOrigin().y);
        int maxX = Math.min(center.x + ceiledRadius, this.gameMap.getOrigin().x + this.gameMap.getWidth() - 1);
        int maxY = Math.min(center.y + ceiledRadius, this.gameMap.getOrigin().y + this.gameMap.getHeight() - 1);
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

    public void addBuffs(Team t, int numBuffs) {
        this.buffsToAdd[t.ordinal()] += numBuffs;
    }

    public void processBeginningOfRound() {
        // Increment round counter
        currentRound++;
        this.teamInfo.updateNumBuffs(currentRound);

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

    /**
     * Sets the winner if one of the teams has been annihilated.
     *
     * @return whether or not a winner was set
     */
    public boolean setWinnerIfAnnihilated() {
        int robotCountA = objectInfo.getRobotCount(Team.A);
        int robotCountB = objectInfo.getRobotCount(Team.B);
        if (robotCountA == 0) {
            setWinner(Team.B, DominationFactor.ANNIHILATED);
            return true;
        } else if (robotCountB == 0) {
            setWinner(Team.A, DominationFactor.ANNIHILATED);
            return true;
        }
        return false;
    }

    /**
     * Sets the winner if one of the teams has more votes than the other.
     *
     * @return whether or not a winner was set
     */
    public boolean setWinnerIfMoreVotes() {
        int numVotesA = teamInfo.getVotes(Team.A);
        int numVotesB = teamInfo.getVotes(Team.B);
        if (numVotesA > numVotesB) {
            setWinner(Team.A, DominationFactor.MORE_VOTES);
            return true;
        } else if (numVotesB > numVotesA) {
            setWinner(Team.B, DominationFactor.MORE_VOTES);
            return true;
        }
        return false;
    }

    /**
     * Sets the winner if one of the teams has more Enlightenment Centers than the other.
     *
     * @return whether or not a winner was set
     */
    public boolean setWinnerIfMoreEnlightenmentCenters() {
        int[] numEnlightenmentCenters = new int[2];
        for (InternalRobot robot : objectInfo.robotsArray()) {
            if (robot.getType() != RobotType.ENLIGHTENMENT_CENTER) continue;
            if (robot.getTeam() == Team.NEUTRAL) continue;
            numEnlightenmentCenters[robot.getTeam().ordinal()]++;
        }
        if (numEnlightenmentCenters[0] > numEnlightenmentCenters[1]) {
            setWinner(Team.A, DominationFactor.MORE_ENLIGHTENMENT_CENTERS);
            return true;
        } else if (numEnlightenmentCenters[1] > numEnlightenmentCenters[0]) {
            setWinner(Team.B, DominationFactor.MORE_ENLIGHTENMENT_CENTERS);
            return true;
        }
        return false;
    }

    /**
     * Sets the winner if one of the teams has higher total unit influence.
     *
     * @return whether or not a winner was set
     */
    public boolean setWinnerIfMoreInfluence() {
        int[] totalInfluences = new int[2];
        for (InternalRobot robot : objectInfo.robotsArray()) {
            if (robot.getTeam() == Team.NEUTRAL) continue;
            totalInfluences[robot.getTeam().ordinal()] += robot.getInfluence();
        }
        if (totalInfluences[0] > totalInfluences[1]) {
            setWinner(Team.A, DominationFactor.MORE_INFLUENCE);
            return true;
        } else if (totalInfluences[1] > totalInfluences[0]) {
            setWinner(Team.B, DominationFactor.MORE_INFLUENCE);
            return true;
        }
        return false;
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
        int[] highestBids = new int[2];
        InternalRobot[] highestBidders = new InternalRobot[2];

        // Process end of each robot's round
        objectInfo.eachRobot((robot) -> {
            int bid = robot.getBid();
            int teamIdx = robot.getTeam().ordinal();
            if (bid > highestBids[teamIdx] || highestBidders[teamIdx] == null ||
                (bid == highestBids[teamIdx] && robot.compareTo(highestBidders[teamIdx]) < 0)) {
                highestBids[teamIdx] = bid;
                highestBidders[teamIdx] = robot;
            }
            robot.resetBid();
            robot.processEndOfRound();
            return true;
        });

        // Process bidding
        int[] teamVotes = new int[2];
        int[] teamBidderIDs = new int[2];

        if (highestBids[0] > highestBids[1] && highestBids[0] > 0) {
            // Team.A wins
            teamVotes[0] = 1;
            teamBidderIDs[0] = highestBidders[0].getID();
            highestBidders[0].addInfluenceAndConviction(-highestBids[0]);
            this.teamInfo.addVote(Team.A);
        } else if (highestBids[1] > highestBids[0] && highestBids[1] > 0) {
            // Team.B wins
            teamVotes[1] = 1;
            teamBidderIDs[1] = highestBidders[1].getID();
            highestBidders[1].addInfluenceAndConviction(-highestBids[1]);
            this.teamInfo.addVote(Team.B);
        }

        for (int i = 0; i < 2; i++) {
            if (teamVotes[i] == 0 && highestBidders[i] != null) {
                // Didn't win. If didn't place bid, halfBid == 0
                int halfBid = (highestBids[i] + 1) / 2;
                highestBidders[i].addInfluenceAndConviction(-halfBid);
            }
        }

        // Send teamVotes and teamBidderIDs to matchmaker
        for (int i = 0; i < 2; i++)
            this.matchMaker.addTeamVote(Team.values()[i], teamVotes[i], teamBidderIDs[i]);

        // Add buffs from expose
        int nextRound = currentRound + 1;
        for (int i = 0; i < 2; i++) {
            this.teamInfo.addBuffs(nextRound, Team.values()[i], this.buffsToAdd[i]);
            this.buffsToAdd[i] = 0; // reset
        }

        // Check for end of match
        setWinnerIfAnnihilated();
        if (timeLimitReached() && gameStats.getWinner() == null)
            if (!setWinnerIfMoreVotes())
                if (!setWinnerIfMoreEnlightenmentCenters())
                    if (!setWinnerIfMoreInfluence())
                        setWinnerArbitrary();

        if (gameStats.getWinner() != null)
            running = false;
    }

    // *********************************
    // ****** SPAWNING *****************
    // *********************************

    public int spawnRobot(InternalRobot parent, int ID, RobotType type, MapLocation location, Team team, int influence) {
        InternalRobot robot = new InternalRobot(this, parent, ID, type, location, team, influence);
        objectInfo.spawnRobot(robot);
        addRobot(location, robot);

        controlProvider.robotSpawned(robot);
        matchMaker.addSpawnedRobot(robot);
        return ID;
    }

    public int spawnRobot(InternalRobot parent, RobotType type, MapLocation location, Team team, int influence) {
        int ID = idGenerator.nextID();
        return spawnRobot(parent, ID, type, location, team, influence);
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


