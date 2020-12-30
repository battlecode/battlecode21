package battlecode.world;

import battlecode.common.*;
import static battlecode.common.GameActionExceptionType.*;
import battlecode.instrumenter.RobotDeathException;
import battlecode.schema.Action;

import java.util.*;


/**
 * The actual implementation of RobotController. Its methods *must* be called
 * from a player thread.
 *
 * It is theoretically possible to have multiple for a single InternalRobot, but
 * that may cause problems in practice, and anyway why would you want to?
 *
 * All overriden methods should assertNotNull() all of their (Object) arguments,
 * if those objects are not explicitly stated to be nullable.
 */
public final strictfp class RobotControllerImpl implements RobotController {

    /**
     * The world the robot controlled by this controller inhabits.
     */
    private final GameWorld gameWorld;

    /**
     * The robot this controller controls.
     */
    private final InternalRobot robot;

    /**
     * An rng based on the world seed.
     */
    private static Random random;

    /**
     * Create a new RobotControllerImpl
     *
     * @param gameWorld the relevant world
     * @param robot the relevant robot
     */
    public RobotControllerImpl(GameWorld gameWorld, InternalRobot robot) {
        this.gameWorld = gameWorld;
        this.robot = robot;

        this.random = new Random(gameWorld.getMapSeed());
    }

    // *********************************
    // ******** INTERNAL METHODS *******
    // *********************************

    /**
     * Throw a null pointer exception if an object is null.
     *
     * @param o the object to test
     */
    private static void assertNotNull(Object o) {
        if (o == null) {
            throw new NullPointerException("Argument has an invalid null value");
        }
    }

    @Override
    private int hashCode() {
        return robot.getID();
    }

    // *********************************
    // ****** GLOBAL QUERY METHODS *****
    // *********************************

    @Override
    public int getRoundNum() {
        return gameWorld.getCurrentRound();
    }

    @Override
    public int getTeamVotes() {
        return gameWorld.getTeamInfo().getVotes(getTeam());
    }

    @Override
    public int getRobotCount() {
        return gameWorld.getObjectInfo().getRobotCount(getTeam());
    }

    @Override
    double getEmpowerFactor(Team team, int roundsInFuture) {
        return gameWorld.getTeamInfo().getBuff(team, getRoundNum() + roundsInFuture);
    }

    // *********************************
    // ****** UNIT QUERY METHODS *******
    // *********************************

    @Override
    public int getID() {
        return this.robot.getID();
    }

    @Override
    public Team getTeam() {
        return this.robot.getTeam();
    }

    @Override
    public RobotType getType() {
        return this.robot.getType();
    }

    @Override
    public MapLocation getLocation() {
        return this.robot.getLocation();
    }

    private InternalRobot getRobotByID(int id) {
        if (!gameWorld.getObjectInfo().existsRobot(id))
            return null;
        return this.gameWorld.getObjectInfo().getRobotByID(id);
    }
 
    private int getInfluence() {
        return this.robot.getInfluence();
    }

    private double getConviction() {
        return this.robot.getConviction();  
    }


    // ***********************************
    // ****** GENERAL SENSOR METHODS *****
    // ***********************************

    @Override
    public boolean onTheMap(MapLocation loc) throws GameActionException {
        assertNotNull(loc);
        if (!this.robot.canSenseLocation(loc))
            throw new GameActionException(CANT_SENSE_THAT,
                    "Target location not within sensor range");
        return gameWorld.getGameMap().onTheMap(loc);
    }

    private void assertCanSenseLocation(MapLocation loc) throws GameActionException {
        assertNotNull(loc);
        if (!this.robot.canSenseLocation(loc))
            throw new GameActionException(CANT_SENSE_THAT,
                    "Target location not within sensor range");
        if (!gameWorld.getGameMap().onTheMap(loc))
            throw new GameActionException(CANT_SENSE_THAT,
                    "Target location is not on the map");
    }

    @Override
    public boolean canSenseLocation(MapLocation loc) {
        try {
            assertCanSenseLocation(loc);
            return true;
        } catch (GameActionException e) { return false; }
    }

    @Override
    public boolean canSenseRadiusSquared(int radiusSquared) {
        return this.robot.canSenseRadiusSquared(radiusSquared);
    }

    private void assertCanDetectLocation(MapLocation loc) throws GameActionException {
        assertNotNull(loc);
        if (!this.robot.canDetectLocation(loc))
            throw new GameActionException(CANT_SENSE_THAT,
                    "Target location not within detection range");
        if (!gameWorld.getGameMap().onTheMap(loc))
            throw new GameActionException(CANT_SENSE_THAT,
                    "Target location is not on the map");
    }

    @Override
    public boolean canDetectLocation(MapLocation loc) {
        try {
            assertCanDetectLocation(loc);
            return true;
        } catch (GameActionException e) { return false; }
    }

    @Override
    public boolean canDetectRadiusSquared(int radiusSquared) {
        return this.robot.canDetectRadiusSquared(radiusSquared);
    }

    @Override
    public boolean isLocationOccupied(MapLocation loc) throws GameActionException {
        assertCanDetectLocation(loc);
        return this.gameWorld.getRobot(loc) != null;
    }

    @Override
    public RobotInfo senseRobotAtLocation(MapLocation loc) throws GameActionException {
        assertCanSenseLocation(loc);
        InternalRobot bot = gameWorld.getRobot(loc);
        if (bot != null)
            return bot.getRobotInfo(getType().canTrueSense());
        return null;
    }

    @Override
    public boolean canSenseRobot(int id) {
        InternalRobot sensedRobot = getRobotByID(id);
        return sensedRobot == null ? false : canSenseLocation(sensedRobot.getLocation());
    }

    @Override
    public RobotInfo senseRobot(int id) throws GameActionException {
        if (!canSenseRobot(id))
            throw new GameActionException(CANT_SENSE_THAT,
                    "Can't sense given robot; It may not exist anymore");
        return getRobotByID(id).getRobotInfo(getType().canTrueSense());
    }

    @Override
    public RobotInfo[] senseNearbyRobots() {
        return senseNearbyRobots(-1);
    }

    @Override
    public RobotInfo[] senseNearbyRobots(int radiusSquared) {
        return senseNearbyRobots(radiusSquared, null);
    }

    @Override
    public RobotInfo[] senseNearbyRobots(int radiusSquared, Team team) {
        return senseNearbyRobots(getLocation(), radiusSquared, team);
    }

    @Override
    public RobotInfo[] senseNearbyRobots(MapLocation center, int radiusSquared, Team team) {
        assertNotNull(center);
        int actualRadiusSquared = radiusSquared == -1 ? getType().sensorRadiusSquared : Math.min(radiusSquared, getType().sensorRadiusSquared)
        InternalRobot[] allSensedRobots = gameWorld.getAllRobotsWithinRadiusSquared(center, actualRadiusSquared);
        List<RobotInfo> validSensedRobots = new ArrayList<>();
        for (InternalRobot sensedRobot : allSensedRobots) {
            // check if this robot
            if (sensedRobot.equals(this.robot))
                continue;
            // check if can sense
            if (!canSenseLocation(sensedRobot.getLocation()))
                continue; 
            // check if right team
            if (team != null && sensedRobot.getTeam() != team)
                continue;
            validSensedRobots.add(sensedRobot.getRobotInfo(getType().canTrueSense()));
        }
        return validSensedRobots.toArray(new RobotInfo[validSensedRobots.size()]);
    }

    @Override
    public MapLocation[] detectNearbyRobots() {
        return detectNearbyRobots(-1);
    }

    @Override
    public MapLocation[] detectNearbyRobots(int radiusSquared) {
        return detectNearbyRobots(getLocation(), radiusSquared);
    }

    @Override
    public MapLocation[] detectNearbyRobots(MapLocation center, int radiusSquared) {
        assertNotNull(center);
        int actualRadiusSquared = radiusSquared == -1 ? getType().detectionRadiusSquared : Math.min(radiusSquared, getType().detectionRadiusSquared)
        InternalRobot[] allDetectedRobots = gameWorld.getAllRobotsWithinRadiusSquared(center, actualRadiusSquared);
        List<MapLocation> validDetectedRobots = new ArrayList<>();
        for (InternalRobot detectedRobot : allDetectedRobots) {
            // check if this robot
            if (detectedRobot.equals(this.robot))
                continue;
            // check if can detect
            if (!canDetectLocation(detectedRobot.getLocation()))
                continue;
            validDetectedRobots.add(detectedRobot.getLocation());
        }
        return validDetectedRobots.toArray(new MapLocation[validDetectedRobots.size()]);
    }

    @Override 
    public double sensePassability(MapLocation loc) {
        assertCanSenseLocation(loc);
        return this.gameWorld.getPassability(loc);
    }

    @Override
    public MapLocation adjacentLocation(Direction dir) {
        return getLocation().add(dir);
    }

    // ***********************************
    // ****** READINESS METHODS **********
    // ***********************************

    private void assertIsReady() throws GameActionException {
        if (getCooldownTurns() >= 1)
            throw new GameActionException(IS_NOT_READY,
                    "This robot's action cooldown has not expired.");
    }

    /**
     * Check if the robot is ready to perform an action. Returns true if
     * the current cooldown counter is strictly less than 1.
     *
     * @return true if the robot can do an action, false otherwise
     */
    @Override
    public boolean isReady() {
        try {
            assertIsReady();
            return true;
        } catch (GameActionException e) { return false; }
    }

    /**
     * Return the cooldown turn counter of the robot. If this is < 1, the robot
     * can perform an action; otherwise, it cannot.
     * The counter is decreased by 1 at the start of every
     * turn, and increased to varying degrees by different actions taken.
     *
     * @return the number of cooldown turns as a float
     */
    @Override
    public float getCooldownTurns() {
        return this.robot.getCooldownTurns();
    }

    // ***********************************
    // ****** MOVEMENT METHODS ***********
    // ***********************************

    private void assertCanMove(Direction dir) throws GameActionException {
        assertNotNull(dir);
        if (!getType().canMove())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot move.");
        MapLocation loc = adjacentLocation(dir);
        if (!onTheMap(loc))
            throw new GameActionException(OUT_OF_RANGE,
                    "Can only move to locations on the map; " + loc + " is not on the map.");
        if (isLocationOccupied(loc))
            throw new GameActionException(CANT_MOVE_THERE,
                    "Cannot move to an occupied location; " + loc + " is occupied.");
        if (!isReady())
            throw new GameActionException(IS_NOT_READY,
                    "Robot is still cooling down! You need to wait before you can perform another action.");
    }

    @Override
    public boolean canMove(Direction dir) {
        try {
            assertCanMove(dir);
            return true;
        } catch (GameActionException e) { return false; }
    }

    @Override
    public void move(Direction dir) throws GameActionException {
        assertCanMove(dir);

        MapLocation center = adjacentLocation(dir);
        this.robot.addCooldownTurns();
        this.gameWorld.moveRobot(getLocation(), center);
        this.robot.setLocation(center);

        gameWorld.getMatchMaker().addMoved(getID(), getLocation());
    }

    // ***********************************
    // ****** BUILDING/SPAWNING **********
    // ***********************************

    private void assertCanBuildRobot(RobotType type, Direction dir, int influence) throws GameActionException {
        assertNotNull(type);
        assertNotNull(dir);
        if (!getType().canBuild(type))
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot build robots of type" + type + ".");
        if (influence <= 0)
            throw new GameActionException(CANT_DO_THAT,
                    "Cannot spend nonpositive amount of influence.");
        if (influence > getInfluence())
            throw new GameActionException(CANT_DO_THAT,
                    "Cannot spend more influence than you have.");
        MapLocation spawnLoc = adjacentLocation(dir);
        if (!onTheMap(spawnLoc))
            throw new GameActionException(OUT_OF_RANGE,
                    "Can only spawn to locations on the map; " + spawnLoc + " is not on the map.");
        if (isLocationOccupied(spawnLoc))
            throw new GameActionException(CANT_MOVE_THERE,
                    "Cannot spawn to an occupied location; " + spawnLoc + " is occupied.");
        if (!isReady())
            throw new GameActionException(IS_NOT_READY,
                    "Robot is still cooling down! You need to wait before you can perform another action.");
    }

    @Override
    public boolean canBuildRobot(RobotType type, Direction dir, int influence) {
        try {
            assertCanBuildRobot(type, dir, influence);
            return true;
        } catch (GameActionException e) { return false; }
    }

    @Override
    public void buildRobot(RobotType type, Direction dir, int influence) throws GameActionException {
        assertCanBuildRobot(type, dir, influence);

        this.robot.addCooldownTurns();
        this.robot.addInfluenceAndConviction(-influence);
        gameWorld.getMatchMaker().addAction(getID(), Action.CHANGE_INFLUENCE, -influence);

        int robotID = gameWorld.spawnRobot(type, adjacentLocation(dir), getTeam());
        gameWorld.getMatchMaker().addAction(getID(), Action.SPAWN_UNIT, robotID);
    }
    
    // ***********************************
    // ****** POLITICIAN METHODS ********* 
    // ***********************************

    private void assertCanEmpower(int radiusSquared) throws GameActionException {
        assertIsReady();
        if (!getType().canEmpower())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot empower.");
        if (radiusSquared > getType().actionRadiusSquared)
            throw new GameActionException(CANT_DO_THAT,
                    "Robot's empower radius is smaller than radius specified");
    }

    @Override
    public boolean canEmpower(int radiusSquared) {
        try {
            assertCanEmpower(radiusSquared);
            return true;
        } catch (GameActionException e) { return false; } 
    }
    
    @Override
    public void empower(int radiusSquared) throws GameActionException {
        assertCanEmpower(radiusSquared);

        this.robot.addCooldownTurns(); // not needed but here for the sake of consistency
        this.robot.empower(radiusSquared);
        gameWorld.getMatchMaker().addAction(getID(), Action.EMPOWER, -1);

        // self-destruct
        gameWorld.destroyRobot(this.robot.getID());
    }


    // ***********************************
    // ****** MUCKRAKER METHODS ********** 
    // *********************************** 
    
    private void assertCanExpose(MapLocation loc) throws GameActionException {
        assertIsReady();
        if (!getType().canExpose())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot expose.");
        if (!onTheMap(loc))
            throw new GameActionException(CANT_DO_THAT,
                    "Location is not on the map.");
        if (!this.robot.canActLocation(loc))
            throw new GameActionException(CANT_DO_THAT,
                    "Location can't be exposed because it is out of range.");
        InternalRobot bot = gameWorld.getRobot(loc);
        if (bot == null)
            throw new GameActionException(CANT_DO_THAT,
                    "There is no robot at specified location.");
        if (!(bot.getType().canBeExposed()))
            throw new GameActionException(CANT_DO_THAT, 
                    "Robot at target location is not of a type that can be exposed.");
        if (bot.getTeam() == getTeam())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot at target location is not on the enemy team.");
    }

    @Override
    public boolean canExpose(MapLocation loc) {
        try {
            assertCanExpose(loc);
            return true;
        } catch (GameActionException e) { return false; }  
    }
    
    @Override
    public void expose(MapLocation loc) throws GameActionException {
        assertCanExpose(loc);

        this.robot.addCooldownTurns();
        InternalRobot bot = gameWorld.getRobot(loc);
        int exposedID = bot.getID();
        this.robot.expose(bot); // TODO: assumes method in InternalRobot void expose(InternalRobot bot)
        gameWorld.getMatchMaker().addAction(getID(), Action.EXPOSE, exposedID);
    }

    // ***********************************
    // *** ENLIGHTENMENT CENTER METHODS **
    // ***********************************

    @Override
    private void assertCanBid(int influence) throws GameActionException {
        if (!getType().canBid()) {
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot bid.");
        } else if (influence <= 0) {
            throw new GameActionException(CANT_DO_THAT,
                    "Can only bid non-negative amounts of influence.");
        } else if (influence > getInfluence()) {
            throw new GameActionException(CANT_DO_THAT,
                    "Not possible to bid influence you don't have.");
        }
    }

    @Override
    public boolean canBid(int influence) {
        try {
            assertCanBid(influence);
            return true;
        } catch (GameActionException e) { return false; }  
    }

    @Override
    public void bid(int influence) throws GameActionException {
        assertCanBid(influence);

        this.robot.bid(influence); // TODO: assumes method in InternalRobot
        gameWorld.getMatchMaker().addAction(getID(), Action.PLACE_BID, influence);
    }

    // ***********************************
    // ****** COMMUNICATION METHODS ****** 
    // ***********************************

    @Override
    public void setFlag(int flag) throws GameActionException {
        this.robot.setFlag(flag);
        gameWorld.getMatchMaker().addAction(getID(), Action.SET_FLAG, flag);
    }

    private void assertCanGetFlag(int id) throws GameActionException {
        InternalRobot bot = getRobotByID(id);
        if (bot == null)
            throw new GameActionException(CANT_DO_THAT,
                    "Robot of given ID does not exist.");
        if (bot.getType() != ENLIGHTENMENT_CENTER && !canSenseLocation(bot.getLocation()))  
            throw new GameActionException(CANT_SENSE_THAT,
                    "Robot at location is out of sensor range and not an Enlightenment Center.");
    }

    @Override
    public boolean canGetFlag(int id) {
        try {
            assertCanGetFlag(id);
            return true;
        } catch (GameActionException e) { return false; }
    }

    @Override
    public int getFlag(int id) throws GameActionException {
        assertCanGetFlag(id);

        return getRobotByID(id).getFlag();
    } 

    // ***********************************
    // ****** OTHER ACTION METHODS *******
    // ***********************************

    /**
     * This used to be public, but is not public in 2021 because
     * slanderers should not be able to self-destruct.
     */
    private void disintegrate() {
        throw new RobotDeathException();
    }

    @Override
    public void resign() {
        gameWorld.getObjectInfo().eachRobot((robot) -> {
            if (robot.getTeam() == getTeam()) {
                gameWorld.destroyRobot(robot.getID());
            }
            return true;
        });
    }

    // ***********************************
    // ******** DEBUG METHODS ************
    // ***********************************

    @Override
    public void setIndicatorDot(MapLocation loc, int red, int green, int blue) {
        assertNotNull(loc);
        gameWorld.getMatchMaker().addIndicatorDot(getID(), loc, red, green, blue);
    }

    @Override
    public void setIndicatorLine(MapLocation startLoc, MapLocation endLoc, int red, int green, int blue) {
        assertNotNull(startLoc);
        assertNotNull(endLoc);
        gameWorld.getMatchMaker().addIndicatorLine(getID(), startLoc, endLoc, red, green, blue);
    }

}
