package battlecode.world;

import battlecode.common.*;
import battlecode.schema.Action;

/**
 * The representation of a robot used by the server.
 */
public strictfp class InternalRobot {
    private final RobotControllerImpl controller;
    private final GameWorld gameWorld;

    private final int ID;
    private Team team;
    private RobotType type;
    private MapLocation location;

    private long controlBits;
    private int currentBytecodeLimit;
    private int bytecodesUsed;

    private int roundsAlive; // WILL NOT INCLUDE ROUNDS BLOCKED WHEN PICKED UP BY DRONE
    private int soupCarrying; // amount of soup the robot is carrying (miners and refineries)
    private int dirtCarrying; // amount of dirt the robot is carrying (landscapers and buildings)
    
    private float cooldownTurns;

    private boolean currentlyHoldingUnit;
    private int idOfUnitCurrentlyHeld;

    private boolean blocked;  // when picked up by a delivery drone

    /**
     * Used to avoid recreating the same RobotInfo object over and over.
     */
    private RobotInfo cachedRobotInfo;

    /**
     * Create a new internal representation of a robot
     *
     * @param gw the world the robot exists in
     * @param type the type of the robot
     * @param loc the location of the robot
     * @param team the team of the robot
     */
    @SuppressWarnings("unchecked")
    public InternalRobot(GameWorld gw, int id, RobotType type, MapLocation loc, Team team) {
        this.ID = id;
        this.team = team;
        this.type = type;
        this.location = loc;

        this.controlBits = 0;
        this.currentBytecodeLimit = type.bytecodeLimit;
        this.bytecodesUsed = 0;

        this.roundsAlive = 0;
        this.soupCarrying = 0;
        this.dirtCarrying = 0;
        
        this.cooldownTurns = 0;

        this.currentlyHoldingUnit = false;
        this.idOfUnitCurrentlyHeld = -1;

        this.blocked = false;

        this.gameWorld = gw;
        this.controller = new RobotControllerImpl(gameWorld, this);
    }

    // ******************************************
    // ****** GETTER METHODS ********************
    // ******************************************

    public RobotControllerImpl getController() {
        return controller;
    }

    public GameWorld getGameWorld() {
        return gameWorld;
    }

    public int getID() {
        return ID;
    }

    public Team getTeam() {
        return team;
    }

    public RobotType getType() {
        return type;
    }

    public MapLocation getLocation() {
        return location;
    }

    public long getControlBits() {
        return controlBits;
    }

    public int getBytecodesUsed() {
        return bytecodesUsed;
    }

    public int getRoundsAlive() {
        return roundsAlive;
    }

    public int getSoupCarrying() {
        return soupCarrying;
    }

    public int getDirtCarrying() {
        return dirtCarrying;
    }
    
    public float getCooldownTurns() {
        return cooldownTurns;
    }

    public boolean isCurrentlyHoldingUnit() {
        return currentlyHoldingUnit;
    }

    public int getIdOfUnitCurrentlyHeld() {
        return idOfUnitCurrentlyHeld;
    }

    public boolean isBlocked() {
        return blocked;
    }

    public RobotInfo getRobotInfo() {
        if (this.cachedRobotInfo != null
                && this.cachedRobotInfo.ID == ID
                && this.cachedRobotInfo.team == team
                && this.cachedRobotInfo.type == type
                && this.cachedRobotInfo.location.equals(location)) {
            return this.cachedRobotInfo;
        }
        return this.cachedRobotInfo = new RobotInfo(
                ID, team, type, location);
    }

    public void pickUpUnit(int id) {
        this.currentlyHoldingUnit = true;
        this.idOfUnitCurrentlyHeld = id;
    }

    public void dropUnit() {
        this.currentlyHoldingUnit = false;
        this.idOfUnitCurrentlyHeld = -1;
    }

    public void blockUnit() {
        this.blocked = true;
    }

    public void unblockUnit() {
        this.blocked = false;
    }

    // **********************************
    // ****** CHECK METHODS *************
    // **********************************

    /**
     * Returns the robot's current sensor radius squared, which is affected
     * by the current pollution level at the present location.
     */
    public int getCurrentSensorRadiusSquared() {
        return (int) Math.round(this.type.sensorRadiusSquared * GameConstants.getSensorRadiusPollutionCoefficient(this.gameWorld.getPollution(getLocation())));
    }

    /**
     * Returns whether this robot can sense the given location.
     * 
     * @param toSense the MapLocation to sense
     */
    public boolean canSenseLocation(MapLocation toSense){
        return this.location.distanceSquaredTo(toSense) <= getCurrentSensorRadiusSquared();
    }

    /**
     * Returns whether this robot can sense something a given radius away.
     * 
     * @param radiusSquared the distance squared to sense
     */
    public boolean canSenseRadiusSquared(int radiusSquared) {
        return radiusSquared <= getCurrentSensorRadiusSquared();
    }

    // ******************************************
    // ****** UPDATE METHODS ********************
    // ******************************************

    /**
     * Sets the location of the robot.
     * 
     * @param loc the new location of the robot
     */
    public void setLocation(MapLocation loc) {
        this.gameWorld.getObjectInfo().moveRobot(this, loc);
        this.location = loc;
    }

    /**
     * Resets the action cooldown using the formula cooldown = type_cooldown + pollution_at_location.
     */
    public void addCooldownTurns() {
        setCooldownTurns(this.cooldownTurns + this.type.actionCooldown * GameConstants.getCooldownPollutionCoefficient(this.gameWorld.getPollution(getLocation())));
    }
    
    /**
     * Sets the action cooldown given the number of turns.
     * 
     * @param newTurns the number of cooldown turns
     */
    public void setCooldownTurns(float newTurns) {
        this.cooldownTurns = newTurns;
    }

    // ******************************************
    // ****** SOUP METHODS **********************
    // ******************************************

    public void addSoupCarrying(int amount) {
        this.soupCarrying += amount;
    }

    public void removeSoupCarrying(int amount) {
        this.soupCarrying = amount > this.soupCarrying ? 0 : this.soupCarrying - amount;
    }

    // ******************************************
    // ****** DIRT METHODS **********************
    // ******************************************

    /**
     * Adds dirt that the robot is carrying. If the robot is a building
     *  and adding the amount makes the amount of dirt carried exceed the
     *  building's dirt limit, then the building is destroyed.
     * 
     * @param amount the amount of dirt to add
     */
    public void addDirtCarrying(int amount) {
        this.dirtCarrying += amount;
        if (getType().isBuilding() && this.dirtCarrying >= getType().dirtLimit)
            this.gameWorld.destroyRobot(getID());
    }

    /**
     * Removes dirt that the robot is carrying.
     * 
     * @param amount the amount of dirt to remove
     * @return the amount of dirt removed
     */
    public int removeDirtCarrying(int amount) {
        int oldDirtCarrying = this.dirtCarrying;
        this.dirtCarrying = amount > this.dirtCarrying ? 0 : this.dirtCarrying - amount;
        return oldDirtCarrying - this.dirtCarrying;
    }

    // *********************************
    // ****** GAMEPLAY METHODS *********
    // *********************************

    // should be called at the beginning of every round
    public void processBeginningOfRound() {
        // this.healthChanged = false;
    }

    public void processBeginningOfTurn() {
        if (this.cooldownTurns > 0)
            this.cooldownTurns = Math.max(0, this.cooldownTurns-1);
        this.currentBytecodeLimit = getType().bytecodeLimit;
    }

    public void processEndOfTurn() {
        // REFINING AND POLLUTION
        // if can produce pollution, reset it now
        if (this.type.canAffectPollution()) {
            this.gameWorld.resetPollutionForRobot(this.ID);
        }
        // whether the robot should pollute
        boolean shouldPollute = false;
        // If refinery//hq, produces refined soup
        if (this.type.canRefine() && this.soupCarrying > 0) {
            int soupProduced = Math.min(this.soupCarrying, this.type.maxSoupProduced);
            this.soupCarrying -= soupProduced;
            this.gameWorld.getTeamInfo().adjustSoup(this.team, soupProduced);
            // this is an action!
            this.gameWorld.getMatchMaker().addAction(this.ID, Action.REFINE_SOUP, -1);
            shouldPollute = true;
        }
        // If vaporator, produces refined soup always
        if (this.type == RobotType.VAPORATOR) {
            this.gameWorld.getTeamInfo().adjustSoup(this.team, this.type.maxSoupProduced);
            shouldPollute = true;
        }
        // If cow, always pollute
        if (this.type == RobotType.COW) {
            shouldPollute = true;
        }
        if (this.type.canAffectPollution() && shouldPollute) {
            this.gameWorld.addGlobalPollution(this.type.globalPollutionAmount);
            // now add a local pollution
            this.gameWorld.addLocalPollution(this.ID, this.getLocation(), this.type.pollutionRadiusSquared, this.type.localPollutionAdditiveEffect, this.type.localPollutionMultiplicativeEffect);
        }

        // bytecode stuff!
        this.gameWorld.getMatchMaker().addBytecodes(ID, this.bytecodesUsed);
        this.roundsAlive++;
    }

    public void processEndOfRound() {
        // OOOOOF
    }

    // *********************************
    // ****** BYTECODE METHODS *********
    // *********************************

    // TODO
    public boolean canExecuteCode() {
        if (isBlocked())  // for delivery drones
            return false;
        // if (getHealth() <= 0.0)
        //     return false;
        // if(type.isBuildable())
        //     return roundsAlive >= 20;
        return true;
    }

    public void setBytecodesUsed(int numBytecodes) {
        this.bytecodesUsed = numBytecodes;
    }

    public int getBytecodeLimit() {
        return canExecuteCode() ? this.currentBytecodeLimit : 0;
    }

    // *********************************
    // ****** VARIOUS METHODS **********
    // *********************************

    public void suicide(){
        this.gameWorld.destroyRobot(getID());

        this.gameWorld.getMatchMaker().addAction(getID(), Action.DIE_SUICIDE, -1);
    }

    // *****************************************
    // ****** MISC. METHODS ********************
    // *****************************************

    @Override
    public boolean equals(Object o) {
        return o != null && (o instanceof InternalRobot)
                && ((InternalRobot) o).getID() == ID;
    }

    @Override
    public int hashCode() {
        return ID;
    }

    @Override
    public String toString() {
        return String.format("%s:%s#%d", getTeam(), getType(), getID());
    }
}
