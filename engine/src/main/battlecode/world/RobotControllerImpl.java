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
     * @return the robot this controller is connected to
     */
    public InternalRobot getRobot() {
        return robot;
    }

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
    public int hashCode() {
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
    public int getRobotCount() {
        return gameWorld.getObjectInfo().getRobotCount(getTeam());
    }

    @Override
    public int getMapWidth() {
        return gameWorld.getGameMap().getWidth();
    }

    @Override
    public int getMapHeight() {
        return gameWorld.getGameMap().getHeight();
    }

    @Override
    public int getSensorRadiusSquared() {
        return this.robot.getSensorRadiusSquared();
    }

    // TODO: update this method!
    @Override
    public int getTeamVotes() {
        return 0;
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
 
    public int getInfluence() {
        return this.robot.getInfluence();  
    }

    public double getConviction() {
        return this.robot.getConviction();  
    }
    // ***********************************
    // ****** GENERAL SENSOR METHODS *****
    // ***********************************

    @Override
    public boolean onTheMap(MapLocation loc) throws GameActionException {
        assertNotNull(loc);
        assertCanSenseLocation(loc);
        return gameWorld.getGameMap().onTheMap(loc);
    }

    private void assertCanSenseLocation(MapLocation loc) throws GameActionException {
        if(!canSenseLocation(loc)){
            throw new GameActionException(CANT_SENSE_THAT,
                    "Target location not within sensor range");
        }
    }

    @Override
    public boolean canSenseLocation(MapLocation loc) {
        assertNotNull(loc);
        return this.robot.canSenseLocation(loc) && gameWorld.getGameMap().onTheMap(loc);
    }

    @Override
    public boolean canSenseRadiusSquared(int radiusSquared) {
        return this.robot.canSenseRadiusSquared(radiusSquared);
    }

    @Override
    public boolean isLocationOccupied(MapLocation loc) throws GameActionException {
        assertNotNull(loc);
        assertCanSenseLocation(loc);
        return this.gameWorld.getRobot(loc) != null;
    }

    @Override
    public RobotInfo senseRobotAtLocation(MapLocation loc) throws GameActionException {
        assertNotNull(loc);
        assertCanSenseLocation(loc);
        InternalRobot bot = gameWorld.getRobot(loc);
        if(bot != null)
            return bot.getRobotInfo();
        return null;
    }

    @Override
    public boolean canSenseRobot(int id) {
        InternalRobot sensedRobot = getRobotByID(id);
        return sensedRobot == null ? false : canSenseLocation(sensedRobot.getLocation());
    }

    @Override
    public RobotInfo senseRobot(int id) throws GameActionException {
        if(!canSenseRobot(id)){
            throw new GameActionException(CANT_SENSE_THAT,
                    "Can't sense given robot; It may not exist anymore");
        }
        return getRobotByID(id).getRobotInfo();
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
        int sensorRadiusSquaredUpperBound = (int) Math.ceil(this.robot.getSensorRadiusSquared());
        InternalRobot[] allSensedRobots = gameWorld.getAllRobotsWithinRadiusSquared(center,
                radiusSquared == -1 ? sensorRadiusSquaredUpperBound : Math.min(radiusSquared, sensorRadiusSquaredUpperBound));
        List<RobotInfo> validSensedRobots = new ArrayList<>();
        for(InternalRobot sensedRobot : allSensedRobots){
            // check if this robot
            if (sensedRobot.equals(this.robot))
                continue;
            // check if can sense
            if (!canSenseLocation(sensedRobot.getLocation()))
                continue;
            // check if right team
            if (team != null && sensedRobot.getTeam() != team)
                continue;
            validSensedRobots.add(sensedRobot.getRobotInfo());
        }
        return validSensedRobots.toArray(new RobotInfo[validSensedRobots.size()]);
    }

    @Override
    public MapLocation adjacentLocation(Direction dir) {
        return getLocation().add(dir);
    }

    //TODO: update this method! 
    @Override 
    public double senseSwamping(MapLocation loc) {
        assertNotNull(loc); 
        assertCanSenseLocation(loc);
        return this.gameWorld.getSwamping(loc);
    }

    // ***********************************
    // ****** READINESS METHODS **********
    // ***********************************

    private void assertIsReady() throws GameActionException {
        if(!isReady()){
            throw new GameActionException(IS_NOT_READY,
                    "This robot's action cooldown has not expired.");
        }
    }

    /**
     * Check if the robot is ready to perform an action. Returns true if
     * the current cooldown counter is strictly less than 1.
     *
     * @return true if the robot can do an action, false otherwise
     */
    @Override
    public boolean isReady() {
        return getCooldownTurns() < 1;
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

    private void assertCanMove(MapLocation loc) throws GameActionException {
        if (!getType().canMove())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot move.");
        if (!getLocation().isAdjacentTo(loc))
            throw new GameActionException(OUT_OF_RANGE,
                    "Can only move to adjacent locations; " + loc + " is not adjacent to " + getLocation() + ".");
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
        assertNotNull(dir);
        return canMove(adjacentLocation(dir));
    }

    private boolean canMove(MapLocation location) {
        try {
            assertNotNull(location);
            assertCanMove(location);
            return true;
        } catch (GameActionException e) { return false; }
    }

    // TODO: update this method
    @Override
    public void move(Direction dir) throws GameActionException {
        assertNotNull(dir);
        MapLocation center = adjacentLocation(dir);
        assertCanMove(center);
        this.robot.addCooldownTurns();
        this.gameWorld.moveRobot(getLocation(), center);
        this.robot.setLocation(center);

        gameWorld.getMatchMaker().addMoved(getID(), getLocation());
    }

    // ***********************************
    // ****** BUILDING/SPAWNING **********
    // ***********************************

    private void assertCanBuildRobot(RobotType type, Direction dir, int influence) throws GameActionException {
        MapLocation spawnLoc = adjacentLocation(dir);
        if (!getType().canBuild(type))
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot build robots of type" + type + ".");
        // TODO: add general resource check
        if (influence <= 0 && influence <= getInfluence()) {  
            throw new GameActionException(CANT_DO_THAT, "Not possible to spend nonpositive amount of influence.");
        } 
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

    //TODO: update maybe?
    @Override
    public boolean canBuildRobot(RobotType type, Direction dir, int influence) {
        try {
            assertNotNull(type);
            assertNotNull(dir);
            assertCanBuildRobot(type, dir, influence);
            return true;
        } catch (GameActionException e) { return false; }
    }

    //TODO: update maybe?
    @Override
    public void buildRobot(RobotType type, Direction dir, int influence) throws GameActionException {
        assertNotNull(type);
        assertNotNull(dir);
        assertCanBuildRobot(type, dir, influence);

        this.robot.addCooldownTurns();
        // TODO: replace with using up resource
        // gameWorld.getTeamInfo().adjustSoup(getTeam(), -type.cost);

        int robotID = gameWorld.spawnRobot(type, adjacentLocation(dir), getTeam());
        // TODO: set cooldown based on cost/type/new constant/etc.
        // getRobotByID(robotID).setCooldownTurns(GameConstants.INITIAL_COOLDOWN_TURNS);

        gameWorld.getMatchMaker().addAction(getID(), Action.SPAWN_UNIT, robotID);
    }

    // General style:
    // - assertCanDoAction throws GameActionException
    // - canDoAction (calls assertCanDoAction in try catch)
    // - doAction (asserts before executing)

    // TODO: for all of doAction methods, assert conditions like not null, can do action
    // then carry out the action, making sure to update information in the world
    // also make sure to add cooldown turns (robot.addCooldownTurns())
    // and to properly update information for replays with gameWorld.getMatchMaker().addAction(...)
    // check to make sure we're not double updating the matchmaker (from gameWorld, and here)

    
    // ***********************************
    // ****** POLITICIAN METHODS ********* 
    // ***********************************
    private void assertCanEmpower() throws GameActionException {
        assertIsReady();
        if (!getType().canEmpower())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot empower.");
    }

    @Override //TODO: UPDATE THIS!!
    public boolean canEmpower() {
        try {
            assertCanEmpower();
            return true;
        } catch (GameActionException e) { return false; } 
    }
    
    @Override //TODO: UPDATE THIS!!
    public void empower() throws GameActionException {
        assertCanEmpower();
        InternalRobot[] allEmpoweredRobots = gameWorld.getAllRobotsWithinRadiusSquared(getLocation(),
                getType().actionRadiusSquared);
        if (allEmpoweredRobots.length != 1) { // 1 because allEmpoweredRobots includes this robot by default
            double convictionChange = getConviction() / (allEmpoweredRobots.length - 1) * this.gameWorld.getEmpowerFactor(getTeam()) ; 
            for (InternalRobot empowered : allEmpoweredRobots) {
                if (this.robot.equals(empowered)) {
                    continue;
                }
                empowered.addConviction(convictionChange * ((empowered.getTeam() == getTeam()) ? 1 : -1));
            }
            
        }
        this.robot.setConviction(0);
    }


    // ***********************************
    // ****** MUCKRAKER METHODS ********** 
    // *********************************** 
    
    private void assertCanExpose(MapLocation loc) throws GameActionException {
        assertIsReady();
        if (!getType().canExpose())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot expose.");  
        assertNotNull(loc); 
        if (!this.robot.canIdentifyLocation(loc))
            throw new GameActionException(OUT_OF_RANGE,
                    "Location can't be exposed because it is out of range."); 
        if (!gameWorld.getGameMap().onTheMap(loc))
            throw new GameActionException(CANT_DO_THAT,
                    "Location is not on the map."); 

    }

    @Override //TODO: UPDATE THIS!!
    public boolean canExpose(MapLocation loc) {
        try {
            assertCanExpose(loc);
            return true;
        } catch (GameActionException e) { return false; }  
    }
    
    @Override //TODO: UPDATE THIS!!
    public void expose(MapLocation loc) throws GameActionException {
        assertCanExpose(loc);
        InternalRobot bot = gameWorld.getRobot(loc);
        if (bot == null || !(bot.getType().canBeExposed()) ) {
            throw new GameActionException(NO_ROBOT_THERE, "Robot tried to expose at location that does not have a Robot that can be Exposed.");
        } else {
            bot.setConviction(0);
            this.gameWorld.addEmpowerFactor(getTeam()); 
        } 
    }
    
    private void assertCanSeek() throws GameActionException {
        assertIsReady();
        if (!getType().canExpose()) // using .canExpose() because they do the same thing (return true iff muckraker)
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot seek.");   
    }

    @Override //TODO: UPDATE THIS!!
    public boolean canSeekLocations() {
        try {
            assertCanSeek();
            return true;
        } catch (GameActionException e) { return false; }  
    }
    
    @Override //TODO: UPDATE THIS!!
    public void seekLocations() throws GameActionException { 
        assertCanSeek();
        MapLocation[] allSeekedLocations = gameWorld.getAllLocationsWithinRadiusSquared(getLocation(), this.robot.getIdentificationRadiusSquared());
        List<MapLocation> validSeekedLocations = new ArrayList<>();
        for(MapLocation seekedLoc: seekedLocations){
            // check if not the robot's location
            if (getLocation().equals(seekedLoc)) //not sure if this is valid? 
                continue;
            // check if occupied
            if (!isLocationOccupied(seekedLoc))
                continue; 
            validSeekedLocations.add(seekedLoc);
        }
        return validSeekedLocations.toArray(new MapLocation[validSeekedLocations.size()]);
    } 
    
    // ***********************************
    // *** ENLIGHTENMENT CENTER METHODS **
    // ***********************************

    @Override //TODO: updated
    private void assertCanBid(int influence) throws GameActionException {
        assertIsReady();
        if (!getType().canBid(influence)) {
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot bid.");
        } else if (influence < 0) {
            throw new GameActionException(CANT_DO_THAT,
                    "Not possible to bid nonnegative amount of influence.");
        } else if (influence > getInfluence()) {
            throw new GameActionException(CANT_DO_THAT,
                    "Not possible to bid influence you don't have.");
        }
    }

    @Override //TODO: updated
    public boolean canBid(int influence) {
        try {
            assertCanBid(influence);
            return true;
        } catch (GameActionException e) { return false; }  
    }

    @Override //TODO: UPDATE THIS!!
    public void bid(int influence) throws GameActionException {
        assertCanBid(influence);
        int chili = 0;
    }

    // ***********************************
    // ****** COMMUNICATION METHODS ****** 
    // ***********************************
    
    
    private void assertCanSetFlag() throws GameActionException {
        assertIsReady(); 
    }


    @Override //TODO: UPDATE THIS!!
    public boolean canSetFlag(); {
        try {
            assertCanSetFlag();
            return true;
        } catch (GameActionException e) {return false;} 
    }

    @Override //TODO: UPDATE THIS!!
    public void setFlag(int flag1, int flag2) throws GameActionException {
        assertCanSetFlag();
        this.robot.setFlag(flag1, flag2);
    }

    private void assertCanGetFlag(MapLocation loc) throws GameActionException {
        assertIsReady(); 
        if (!gameWorld.getGameMap().onTheMap(loc))
            throw new GameActionException(CANT_DO_THAT,
                    "Location is not on the map."); 
        if (!isLocationOccupied(loc))
            throw new GameActionException(CANT_DO_THAT,
                    "Location is not occupied with robot of the same team."); 
        InternalRobot bot = gameWorld.getRobot(loc);
        if (bot.getTeam() != getTeam())  
            throw new GameActionException(CANT_DO_THAT,
                    "Location is not occupied with robot of the same team."); 
        if (bot.getType() != ENLIGHTENMENT_CENTER && getLocation().distanceSquaredTo(bot.getLocation()) > 8)  
            throw new GameActionException(CANT_DO_THAT,
                    "Robot of same team doesn't meet conditions for getting flag."); 
                 
                    
    }

    @Override //TODO: UPDATE THIS!!
    public boolean canGetFlag(MapLocation loc); {
        try {
            assertCanGetFlag(loc);
            return true;
        } catch (GameActionException e) { return false; }
    }

    @Override //TODO: UPDATE THIS!!
    public int[] getFlag(MapLocation loc) throws GameActionException {
        assertCanGetFlag(loc);
        InternalRobot bot = gameWorld.getRobot(loc);
        return bot.getFlag();
    } 


    // ***********************************
    // ****** OTHER ACTION METHODS *******
    // ***********************************

    /** This used to be public, but is not public in 2020 because
     * a robot can simply instead walk into water, which is more fun.
     */
    private void disintegrate(){
        throw new RobotDeathException();
    }

    @Override
    public void resign(){
        gameWorld.getObjectInfo().eachRobot((robot) -> {
            if(robot.getTeam() == getTeam()){
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