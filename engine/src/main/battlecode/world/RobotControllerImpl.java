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
    public int getTeamSoup() {
        return gameWorld.getTeamInfo().getSoup(getTeam());
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
    public int getCurrentSensorRadiusSquared() {
        return this.robot.getCurrentSensorRadiusSquared();
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

    @Override
    public int getSoupCarrying() {
        return this.robot.getSoupCarrying();
    }

    @Override
    public int getDirtCarrying() {
        return this.robot.getDirtCarrying();
    }

    @Override
    public boolean isCurrentlyHoldingUnit() {
        return this.robot.isCurrentlyHoldingUnit();
    }

    private InternalRobot getRobotByID(int id) {
        if (!gameWorld.getObjectInfo().existsRobot(id))
            return null;
        return this.gameWorld.getObjectInfo().getRobotByID(id);
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
        int sensorRadiusSquaredUpperBound = (int) Math.ceil(this.robot.getCurrentSensorRadiusSquared());
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
    public int senseSoup(MapLocation loc) throws GameActionException {
        assertCanSenseLocation(loc);
        return this.gameWorld.getSoup(loc);
    }

    @Override
    public int sensePollution(MapLocation loc) throws GameActionException {
        assertCanSenseLocation(loc);
        return this.gameWorld.getPollution(loc);
    }

    @Override
    public int senseElevation(MapLocation loc) throws GameActionException {
        assertCanSenseLocation(loc);
        return this.gameWorld.getDirt(loc);
    }

    @Override
    public boolean senseFlooding(MapLocation loc) throws GameActionException {
        assertCanSenseLocation(loc);
        return this.gameWorld.isFlooded(loc);
    }

    @Override
    public MapLocation adjacentLocation(Direction dir) {
        return getLocation().add(dir);
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
        if (gameWorld.getDirtDifference(getLocation(), loc) > GameConstants.MAX_DIRT_DIFFERENCE && !getType().canFly())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot fly, and the dirt difference to " + loc + " is " +
                    gameWorld.getDirtDifference(getLocation(), loc) + " which is higher than the limit of " +
                    GameConstants.MAX_DIRT_DIFFERENCE + " for non-flying units.");
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

    @Override
    public void move(Direction dir) throws GameActionException {
        assertNotNull(dir);
        MapLocation center = adjacentLocation(dir);
        assertNotNull(center);
        assertIsReady();
        assertCanMove(center);
        // now check if the location is flooded and the robot can't fly
        if (gameWorld.isFlooded(center) && !getType().canFly()) {
            // kill itself
            disintegrate();
        }
        this.robot.addCooldownTurns();
        this.gameWorld.moveRobot(getLocation(), center);
        this.robot.setLocation(center);

        gameWorld.getMatchMaker().addMoved(getID(), getLocation());

        // also move the robot currently being picked up
        if (this.robot.isCurrentlyHoldingUnit())
            movePickedUpUnit(center);
    }

    // ***********************************
    // ****** BUILDING/SPAWNING **********
    // ***********************************

    private void assertCanBuildRobot(RobotType type, Direction dir) throws GameActionException {
        MapLocation spawnLoc = adjacentLocation(dir);
        if (!getType().canBuild(type))
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot build robots of type" + type + ".");
        if (gameWorld.getTeamInfo().getSoup(getTeam()) < type.cost)
            throw new GameActionException(NOT_ENOUGH_RESOURCE,
                    "Not enough refined soup to build a robot of type" + type + ".");
        if (!onTheMap(spawnLoc))
            throw new GameActionException(OUT_OF_RANGE,
                    "Can only spawn to locations on the map; " + spawnLoc + " is not on the map.");
        if (isLocationOccupied(spawnLoc))
            throw new GameActionException(CANT_MOVE_THERE,
                    "Cannot spawn to an occupied location; " + spawnLoc + " is occupied.");
        if (gameWorld.isFlooded(spawnLoc) && type != RobotType.DELIVERY_DRONE)
            throw new GameActionException(CANT_DO_THAT,
                    "Can only spawn delivery drones to flooded locations; " + spawnLoc + " is flooded but " + type + " is not a delivery drone.");
        if (type != RobotType.DELIVERY_DRONE && gameWorld.getDirtDifference(getLocation(), spawnLoc) > GameConstants.MAX_DIRT_DIFFERENCE)
            throw new GameActionException(CANT_DO_THAT,
                    "Can only spawn delivery drones to locations with high dirt difference; " +
                    "the dirt difference to " + spawnLoc + " is " +
                        gameWorld.getDirtDifference(getLocation(), spawnLoc) + " which is higher than the limit of " +
                        GameConstants.MAX_DIRT_DIFFERENCE + " for non-flying units like " + type + ".");
        if (!isReady())
            throw new GameActionException(IS_NOT_READY,
                    "Robot is still cooling down! You need to wait before you can perform another action.");
    }

    @Override
    public boolean canBuildRobot(RobotType type, Direction dir) {
        try {
            assertNotNull(type);
            assertNotNull(dir);
            assertCanBuildRobot(type, dir);
            return true;
        } catch (GameActionException e) { return false; }
    }

    @Override
    public void buildRobot(RobotType type, Direction dir) throws GameActionException {
        assertNotNull(dir);
        assertCanBuildRobot(type, dir);

        this.robot.addCooldownTurns();
        gameWorld.getTeamInfo().adjustSoup(getTeam(), -type.cost);

        int robotID = gameWorld.spawnRobot(type, adjacentLocation(dir), getTeam());
        getRobotByID(robotID).setCooldownTurns(GameConstants.INITIAL_COOLDOWN_TURNS);

        gameWorld.getMatchMaker().addAction(getID(), Action.SPAWN_UNIT, robotID);
    }

    // ***********************************
    // ****** MINER METHODS **************
    // ***********************************

    /**
     * Asserts that the robot can mine soup in the specified direction.
     *
     * @throws GameActionException
     */
    private void assertCanMineSoup(Direction dir) throws GameActionException {
        MapLocation center = adjacentLocation(dir);
        if (!getType().canMine())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot mine soup.");
        if (getSoupCarrying() >= getType().soupLimit)
            throw new GameActionException(NOT_ENOUGH_RESOURCE,
                    "No space to carry more soup; robot is already carrying " + getType().soupLimit + " units of soup.");
        if (!onTheMap(center))
            throw new GameActionException(OUT_OF_RANGE,
                    "Can only mine from locations on the map; " + center + " is not on the map.");
        if (gameWorld.getSoup(center) <= 0)
            throw new GameActionException(CANT_DO_THAT,
                    center + " does not have any soup to mine.");
        if (!isReady())
            throw new GameActionException(IS_NOT_READY,
                    "Robot is still cooling down! You need to wait before you can perform another action.");
    }

    /**
     * Returns whether or not the robot can mine soup in a specified direction.
     * Checks if the robot can mine, whether they can carry more soup, whether
     *  the action cooldown is ready, whether the location is on the map,
     *  and whether there is soup to be mined in the target location.
     *
     * @param dir the direction to mine in
     */
    @Override
    public boolean canMineSoup(Direction dir) {
        try {
            assertNotNull(dir);
            assertCanMineSoup(dir);
            return true;
        } catch (GameActionException e) { return false; }
    }

    /**
     * Mines soup in a certain direction.
     *
     * @param dir the direction to mine in
     * @throws GameActionException
     */
    @Override
    public void mineSoup(Direction dir) throws GameActionException {
        assertNotNull(dir);
        assertCanMineSoup(dir);
        this.robot.addCooldownTurns();
        MapLocation mineLoc = adjacentLocation(dir);
        int soupMined = Math.min(GameConstants.SOUP_MINING_RATE, Math.min(gameWorld.getSoup(mineLoc), getType().soupLimit - getSoupCarrying()));;
        this.gameWorld.removeSoup(adjacentLocation(dir), soupMined);
        this.robot.addSoupCarrying(soupMined);

        this.gameWorld.getMatchMaker().addAction(getID(), Action.MINE_SOUP, -1);
    }

    /**
     * Asserts that the robot can deposit soup in the specified direction.
     *
     * @throws GameActionException
     */
    private void assertCanDepositSoup(Direction dir) throws GameActionException {
        MapLocation center = adjacentLocation(dir);
        if (!getType().canDepositSoup())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot deposit soup.");
        if (getSoupCarrying() <= 0)
            throw new GameActionException(NOT_ENOUGH_RESOURCE,
                    "Robot is not carrying any soup available to be refined.");
        if (!onTheMap(center))
            throw new GameActionException(OUT_OF_RANGE,
                    "Can only deposit soup to locations on the map; " + center + " is not on the map.");
        InternalRobot adjacentRobot = this.gameWorld.getRobot(center);
        if (adjacentRobot == null || !adjacentRobot.getType().canRefine())
            throw new GameActionException(CANT_DO_THAT,
                    center + " does not have a refinery or HQ.");
        if (!isReady())
            throw new GameActionException(IS_NOT_READY,
                    "Robot is still cooling down! You need to wait before you can perform another action.");
    }

    /**
     * Returns whether or not the robot can deposit soup in a specified direction.
     * Checks if the robot can deposit soup, whether they are carring crude soup, whether
     *  the action cooldown is ready, whether the location is on the map,
     *  and whether there is a refinery at the target location.
     *
     * @param dir the direction to deposit soup in
     */
    @Override
    public boolean canDepositSoup(Direction dir) {
        try {
            assertNotNull(dir);
            assertCanDepositSoup(dir);
            return true;
        } catch (GameActionException e) { return false; }
    }

    /**
     * Deposits soup in a certain direction; deposits up to the amount of crude soup
     *  that the robot is carrying.
     *
     * @param dir the direction to mine in
     * @param amount the amount of soup to deposit
     * @throws GameActionException
     */
    @Override
    public void depositSoup(Direction dir, int amount) throws GameActionException {
        assertNotNull(dir);
        assertCanDepositSoup(dir);
        amount = Math.min(amount, this.getSoupCarrying());
        this.robot.addCooldownTurns();
        this.robot.removeSoupCarrying(amount);
        InternalRobot refinery = this.gameWorld.getRobot(adjacentLocation(dir));
        refinery.addSoupCarrying(amount);

        this.gameWorld.getMatchMaker().addAction(getID(), Action.DEPOSIT_SOUP, refinery.getID());
    }

    // ***************************************
    // ********* LANDSCAPER METHODS **********
    // ***************************************

    /**
     * Asserts that the robot can dig dirt in the specified direction.
     *
     * @throws GameActionException
     */
    private void assertCanDigDirt(Direction dir) throws GameActionException {
        MapLocation center = adjacentLocation(dir);
        if (!getType().canDig())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot dig dirt.");
        if (getDirtCarrying() >= getType().dirtLimit)
            throw new GameActionException(NOT_ENOUGH_RESOURCE,
                    "No space to carry more dirt; robot is already carrying " + getType().dirtLimit + " units of dirt.");
        if (!onTheMap(center))
            throw new GameActionException(OUT_OF_RANGE,
                    "Can only dig dirt from locations on the map; " + center + " is not on the map.");
        InternalRobot adjacentRobot = this.gameWorld.getRobot(center);
        if (adjacentRobot != null)
            if (adjacentRobot.getType().isBuilding() && adjacentRobot.getDirtCarrying() <= 0)
                throw new GameActionException(CANT_DO_THAT,
                        "Can't dig dirt from underneath buildings; " + center + " has a " + adjacentRobot.getType() + ".");
        if (!isReady())
            throw new GameActionException(IS_NOT_READY,
                    "Robot is still cooling down! You need to wait before you can perform another action.");
    }

    /**
     * Returns whether or not the robot can dig dirt in a specified direction.
     * Checks if the robot can dig, whether they can carry more dirt, whether
     *  the action cooldown is ready, and whether the location is on the map.
     *
     * @param dir the direction to dig in
     */
    @Override
    public boolean canDigDirt(Direction dir) {
        try {
            assertNotNull(dir);
            assertCanDigDirt(dir);
            return true;
        } catch (GameActionException e) { return false; }
    }

    /**
     * Digs dirt in a certain direction. THIS METHOD DOES NOT ADD ACTIONS TO
     *  MATCHMAKER BECAUSE THE TARGET CAN BE EITHER A BUILDING OR THE LOCATION,
     *  WE DON'T KNOW YET.
     *
     * @param dir the direction to dig in
     * @throws GameActionException
     */
    @Override
    public void digDirt(Direction dir) throws GameActionException {
        assertNotNull(dir);
        assertCanDigDirt(dir);
        this.robot.addCooldownTurns();
        this.gameWorld.removeDirt(getID(), adjacentLocation(dir));
        this.robot.addDirtCarrying(1);
    }

    /**
     * Asserts that the robot can deposit dirt in the specified direction.
     *
     * @throws GameActionException
     */
    private void assertCanDepositDirt(Direction dir) throws GameActionException {
        MapLocation center = adjacentLocation(dir);
        if (!getType().canDepositDirt())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot deposit dirt.");
        if (getDirtCarrying() < 1)
            throw new GameActionException(NOT_ENOUGH_RESOURCE,
                    "Robot is carrying " + getDirtCarrying() + " units of dirt, and thus cannot deposit any dirt.");
        if (!onTheMap(center))
            throw new GameActionException(OUT_OF_RANGE,
                    "Can only deposit dirt to locations on the map; " + center + " is not on the map.");
        if (!isReady())
            throw new GameActionException(IS_NOT_READY,
                    "Robot is still cooling down! You need to wait before you can perform another action.");
    }

    /**
     * Returns whether or not the robot can deposit dirt in a specified direction.
     * Checks if the robot can deposit, whether they are carrying enough dirt, whether
     *  the action cooldown is ready, and whether the location is on the map.
     *
     * @param dir the direction to deposit in
     */
    @Override
    public boolean canDepositDirt(Direction dir) {
        try {
            assertNotNull(dir);
            assertCanDepositDirt(dir);
            return true;
        } catch (GameActionException e) { return false; }
    }

    /**
     * Deposits dirt in a certain direction. THIS METHOD DOES NOT ADD ACTIONS TO
     *  MATCHMAKER BECAUSE THE TARGET CAN BE EITHER A BUILDING OR THE LOCATION,
     *  WE DON'T KNOW YET.
     *
     * @param dir the direction to deposit in
     * @throws GameActionException
     */
    @Override
    public void depositDirt(Direction dir) throws GameActionException {
        assertNotNull(dir);
        assertCanDepositDirt(dir);
        this.robot.addCooldownTurns();
        this.robot.removeDirtCarrying(1);
        this.gameWorld.addDirt(getID(), adjacentLocation(dir), 1);
    }

    // ***************************************
    // ******* DELIVERY DRONE METHODS ********
    // ***************************************

    /**
     * Asserts that the robot can pick up the unit with the specified id.
     *
     * @throws GameActionException
     */
    private void assertCanPickUpUnit(int id) throws GameActionException {
        if (!getType().canPickUpUnits())
            throw new GameActionException(CANT_PICK_UP_UNIT,
                    "Robot is of type " + getType() + " which cannot pick up other units.");
        if (robot.isCurrentlyHoldingUnit())
            throw new GameActionException(CANT_PICK_UP_UNIT,
                    "Robot is already holding a unit; you can't pick up another one!");
        if (getRobotByID(id) == null)
            throw new GameActionException(NO_ROBOT_THERE,
                    "No unit of ID " + id + " exists! Impossible to pick up nonexistent things.");
        if (!getRobotByID(id).getType().canBePickedUp())
            throw new GameActionException(CANT_PICK_UP_UNIT,
                    "Cannot pick up any unit of type " + getRobotByID(id).getType() + ".");
        if (!getRobotByID(id).getLocation().isWithinDistanceSquared(getLocation(), GameConstants.DELIVERY_DRONE_PICKUP_RADIUS_SQUARED))
            throw new GameActionException(OUT_OF_RANGE,
                    "Cannot pick up unit outside pickup radius; unit is " +
                    getRobotByID(id).getLocation().distanceSquaredTo(getLocation()) +
                            " squared distance away, but the pickup radius squared is " + GameConstants.DELIVERY_DRONE_PICKUP_RADIUS_SQUARED);
        if (getRobotByID(id).isBlocked())
            throw new GameActionException(CANT_PICK_UP_UNIT,
                    "Cannot pick up a unit that is currently picked up by another drone, which " + id + " is.");
        if (!isReady())
            throw new GameActionException(IS_NOT_READY,
                    "Robot is still cooling down! You need to wait before you can perform another action.");
    }

    /**
     * Returns whether or not the robot can pick up the unit with the specified id.
     * Checks if the robot can pick up units, whether they are already carrying a
     *  unit, whether the action cooldown is ready, whether the unit is within pickup
     *  distance, and whether the target unit can be picked up.
     *
     * @param id the id of the unit to be picked up
     */
    @Override
    public boolean canPickUpUnit(int id) {
        try {
            assertCanPickUpUnit(id);
            return true;
        } catch (GameActionException e) { return false; }
    }

    /**
     * Picks up the unit with the specified id.
     *
     * @param id the id of the unit to be picked up
     * @throws GameActionException
     */
    @Override
    public void pickUpUnit(int id) throws GameActionException {
        assertCanPickUpUnit(id);
        InternalRobot pickedUpRobot = getRobotByID(id);
        pickedUpRobot.blockUnit();
        gameWorld.removeRobot(pickedUpRobot.getLocation());
        this.robot.pickUpUnit(id);
        movePickedUpUnit(getLocation());
        this.robot.addCooldownTurns();

        gameWorld.getMatchMaker().addAction(getID(), Action.PICK_UNIT, id);
    }

    /**
     * Asserts that the robot can drop off a unit in the specified direction.
     *
     * @throws GameActionException
     */
    private void assertCanDropUnit(Direction dir) throws GameActionException {
        MapLocation center = adjacentLocation(dir);
        if (!getType().canDropOffUnits())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot drop off units.");
        if (!this.robot.isCurrentlyHoldingUnit())
            throw new GameActionException(NOT_ENOUGH_RESOURCE,
                    "Robot is not currently holding any units to drop off.");
        if (!onTheMap(center))
            throw new GameActionException(OUT_OF_RANGE,
                    "Can only drop units to locations on the map; " + center + " is not on the map.");
        if (isLocationOccupied(center))
            throw new GameActionException(CANT_MOVE_THERE,
                    "Cannot drop off units to an occupied location; " + center + " is occupied.");
        if (!isReady())
            throw new GameActionException(IS_NOT_READY,
                    "Robot is still cooling down! You need to wait before you can perform another action.");
    }

    /**
     * Returns whether or not the robot can drop off a unit in the specified direction.
     * Checks if the robot can drop off units, whether they are carrying a unit, and
     *  whether the action cooldown is ready.
     *
     * @param dir the direction to drop off a unit
     */
    @Override
    public boolean canDropUnit(Direction dir) {
        try {
            assertNotNull(dir);
            assertCanDropUnit(dir);
            return true;
        } catch (GameActionException e) { return false; }
    }

    /**
     * Drops off a unit in the specified direction.
     *
     * @param dir the direction to drop off a unit
     * @throws GameActionException
     */
    @Override
    public void dropUnit(Direction dir) throws GameActionException {
        assertNotNull(dir);
        dropUnit(dir, true);
    }

    /**
     * Drops off a unit in the specified direction.
     *
     * @param dir the direction to drop off a unit, or null if current location
     * @param checkConditions whether or not to assert if the robot can drop
     *        a unit; only false if a drone dies and automatically drops
     * @throws GameActionException
     */
    public void dropUnit(Direction dir, boolean checkConditions) throws GameActionException {
        if (checkConditions)
            assertCanDropUnit(dir);

        int id = this.robot.getIdOfUnitCurrentlyHeld();
        InternalRobot droppedRobot = getRobotByID(id);
        MapLocation targetLocation = dir == null ? getLocation() : adjacentLocation(dir);

        droppedRobot.unblockUnit();
        movePickedUpUnit(targetLocation);
        this.robot.dropUnit();
        this.gameWorld.addRobot(targetLocation, droppedRobot);
        this.robot.addCooldownTurns();

        gameWorld.getMatchMaker().addAction(getID(), Action.DROP_UNIT, id);

        // unit is destroyed if dropped in Ocean
        if (this.gameWorld.isFlooded(targetLocation))
            this.gameWorld.destroyRobot(id);
    }

    /**
     * Moves the picked up unit with the drone.
     *
     * @param center the new location of the drone
     * @throws GameActionException
     */
    private void movePickedUpUnit(MapLocation center) throws GameActionException {
        int id = this.robot.getIdOfUnitCurrentlyHeld();
        getRobotByID(id).setLocation(center);

        this.gameWorld.getMatchMaker().addMoved(id, center);
    }

    // ***************************************
    // ******* NET GUN METHODS ***************
    // ***************************************

    /**
     * Asserts that the robot can shoot down the unit with the specified id.
     *
     * @throws GameActionException
     */
    private void assertCanShootUnit(int id) throws GameActionException {
        InternalRobot targetRobot = getRobotByID(id);
        if (!getType().canShoot())
            throw new GameActionException(CANT_DO_THAT,
                    "Robot is of type " + getType() + " which cannot shoot units.");
        if (targetRobot == null)
            throw new GameActionException(NO_ROBOT_THERE,
                    "No unit of ID " + id + " exists! Impossible to shoot nonexistent things.");
        if (!targetRobot.getType().canBeShot())
            throw new GameActionException(CANT_DO_THAT,
                    "Target robot is of type " + targetRobot.getType() + " which cannot be shot.");

        if (!targetRobot.getLocation().isWithinDistanceSquared(getLocation(), GameConstants.NET_GUN_SHOOT_RADIUS_SQUARED))
            throw new GameActionException(OUT_OF_RANGE,
                    "Cannot shoot unit outside shooting radius; unit is " +
                    targetRobot.getLocation().distanceSquaredTo(getLocation()) +
                            " squared distance away, but the shooting radius squared is " + GameConstants.NET_GUN_SHOOT_RADIUS_SQUARED);
        if (!isReady())
            throw new GameActionException(IS_NOT_READY,
                    "Robot is still cooling down! You need to wait before you can perform another action.");
    }

    /**
     * Returns whether or not the robot can shoot down the unit with the specified id.
     * Checks if the robot can shoot down units, whether the action cooldown is ready,
     *  whether the unit is within pickup distance, and whether the target unit can be shot down.
     *
     * @param id the id of the unit to be shot down
     */
    @Override
    public boolean canShootUnit(int id) {
        try {
            assertCanShootUnit(id);
            return true;
        } catch (GameActionException e) { return false; }
    }

    /**
     * Shoots down the unit with the specified id.
     *
     * @param id the id of the unit to be shot down
     * @throws GameActionException
     */
    @Override
    public void shootUnit(int id) throws GameActionException {
        assertCanShootUnit(id);
        this.gameWorld.destroyRobot(id);
        this.robot.addCooldownTurns();

        gameWorld.getMatchMaker().addAction(getID(), Action.SHOOT, id);
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
    // ****** BLOCKCHAINNNNNNNNNNN *******
    // ***********************************

    private void assertCanSubmitTransaction(int[] message, int cost) throws GameActionException {
        if (message.length > GameConstants.MAX_BLOCKCHAIN_TRANSACTION_LENGTH)
            throw new GameActionException(TOO_LONG_BLOCKCHAIN_TRANSACTION,
                    "Can only send " + Integer.toString(GameConstants.MAX_BLOCKCHAIN_TRANSACTION_LENGTH) +
                            " integers in one message, not " + Integer.toString(message.length) + ".");
        int teamSoup = gameWorld.getTeamInfo().getSoup(getTeam());
        if (gameWorld.getTeamInfo().getSoup(getTeam()) < cost)
            throw new GameActionException(NOT_ENOUGH_RESOURCE,
                    "Tried to pay " + Integer.toString(cost) + " units of soup for a message, only has " + Integer.toString(teamSoup) + ".");
        if (cost <= 0)
            throw new GameActionException(OUT_OF_RANGE,
                    "Can only submit transactions with positive cost!");
    }

    @Override
    public boolean canSubmitTransaction(int[] message, int cost) {
        try {
            assertCanSubmitTransaction(message, cost);
            return true;
        } catch (GameActionException e) { return false; }
    }


    /**
     * Sends a message to the blockchain at the indicated cost.
     * 
     * @param message the message to send.
     * @param cost the price that the unit is willing to pay for the message.
     * @throws GameActionException if message is too long or the team does not
     * have that that much soup.
     * 
     */
    @Override
    public void submitTransaction(int[] message, int cost) throws GameActionException {
        assertCanSubmitTransaction(message, cost);
        // pay!
        gameWorld.getTeamInfo().adjustSoup(getTeam(), -cost);
        // create a block chain entry
        int id = random.nextInt();
        Transaction transaction = new Transaction(cost, message.clone(), id);
        // add
        gameWorld.addTransaction(transaction);
        gameWorld.associateTransaction(transaction, getTeam());
    }

    /**
     * Gets all messages that were sent at a given round.
     *
     * @param roundNumber the round index.
     * @throws GameActionException
     */
    @Override
    public Transaction[] getBlock(int roundNumber) throws GameActionException {
        if (roundNumber <= 0)
            throw new GameActionException(ROUND_OUT_OF_RANGE, "You cannot get the messages sent at round " + Integer.toString(roundNumber)
                + "; in fact, no non-positive round numbers are allowed at all.");
        if (roundNumber >= gameWorld.currentRound)
            throw new GameActionException(ROUND_OUT_OF_RANGE, "You cannot get the messages sent at round " + Integer.toString(roundNumber)
                + "; you can only query previous rounds, and this is round " + Integer.toString(roundNumber) + ".");
        // just get it!
        Transaction[] transactions = gameWorld.blockchain.get(roundNumber-1).toArray(new Transaction[0]);
        return transactions;
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
