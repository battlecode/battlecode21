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
    private double influence;
    private double conviction;

    private long controlBits;
    private int currentBytecodeLimit;
    private int bytecodesUsed;

    private int roundsAlive;

    private float cooldownTurns;

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
     * @param influence the influence used to create the robot
     */
    @SuppressWarnings("unchecked")
    public InternalRobot(GameWorld gw, int id, RobotType type, MapLocation loc, Team team, double influence) {
        this.ID = id;
        this.team = team;
        this.type = type;
        this.location = loc;
        this.influence = influence;
        if (this.type == POLITICIAN || this.type == SLANDERER) {
            this.conviction = (this.influence * this.influence);
        }
        else if (this.type == MUCKRAKER) {
            this.conviction = Math.ceil(this.influence * this.influence);
        }
        else {
            this.conviction = 0;
        }

        this.controlBits = 0;
        this.currentBytecodeLimit = type.bytecodeLimit;
        this.bytecodesUsed = 0;

        this.roundsAlive = 0;

        this.cooldownTurns = 0;

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

    public double getInfluence() {
        return influence;
    }

    public double getConviction() {
        return conviction;
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

    public float getCooldownTurns() {
        return cooldownTurns;
    }

    // TODO: update RobotInfo.java
    public RobotInfo getRobotInfo() {
        if (this.cachedRobotInfo != null
                && this.cachedRobotInfo.ID == ID
                && this.cachedRobotInfo.team == team
                && this.cachedRobotInfo.type == type
                && this.cachedRobotInfo.influence == influence
                && this.cachedRobotInfo.influence == conviction                
                && this.cachedRobotInfo.location.equals(location)) {
            return this.cachedRobotInfo;
        }
        return this.cachedRobotInfo = new RobotInfo(
                ID, team, type, location, influence, conviction);
    }

    // **********************************
    // ****** CHECK METHODS *************
    // **********************************

    /**
     * Returns the robot's detection radius squared.
     */
    public int getDetectionRadiusSquared() {
        return this.type.detectionRadiusSquared;
    }

    /**
     * Returns the robot's identification radius squared.
     */
    public int getIdentificationRadiusSquared() {
        return this.type.identificationRadiusSquared;
    }

    /**
     * Returns the robot's action radius squared.
     */
    public int getActionRadiusSquared() {
        return this.type.actionRadiusSquared;
    }

    /**
     * Returns whether this robot can detect the given location.
     * 
     * @param toSense the MapLocation to sense
     */
    public boolean canDetectLocation(MapLocation toSense){
        return this.location.distanceSquaredTo(toSense) <= getDetectionRadiusSquared();
    }

    /**
     * Returns whether this robot can identify the given location.
     * 
     * @param toSense the MapLocation to sense
     */
    public boolean canIdentifyLocation(MapLocation toSense){
        return this.location.distanceSquaredTo(toSense) <= getIdentificationRadiusSquared();
    }

    /**
     * Returns whether this robot can perform actions on the given location.
     * 
     * @param toSense the MapLocation to sense
     */
    public boolean canActLocation(MapLocation toSense){
        return this.location.distanceSquaredTo(toSense) <= getActionRadiusSquared();
    }

    /**
     * Returns whether this robot can sense something a given radius away.
     * 
     * @param radiusSquared the distance squared to sense
     */
    public boolean canDetectRadiusSquared(int radiusSquared) {
        return radiusSquared <= getDetectionRadiusSquared();
    }

    /**
     * Returns whether this robot can sense something a given radius away.
     * 
     * @param radiusSquared the distance squared to sense
     */
    public boolean canIdentifyRadiusSquared(int radiusSquared) {
        return radiusSquared <= getIdentificationRadiusSquared();
    }

    /**
     * Returns whether this robot can sense something a given radius away.
     * 
     * @param radiusSquared the distance squared to sense
     */
    public boolean canActRadiusSquared(int radiusSquared) {
        return radiusSquared <= getActionRadiusSquared();
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
     * Resets the action cooldown.
     */
    public void addCooldownTurns() {
        setCooldownTurns(this.cooldownTurns + this.type.actionCooldown);
    }
    
    /**
     * Sets the action cooldown given the number of turns.
     * 
     * @param newTurns the number of cooldown turns
     */
    public void setCooldownTurns(float newTurns) {
        this.cooldownTurns = newTurns;
    }

    /**
     * Adds conviction given an amount to change this
     * robot's conviction by. Input can be negative to
     * subtract conviction.
     * 
     * @param convictionAmount the amount to change conviction by (can be negative)
     */
    public void addConviction(double convictionAmount) {
        setConviction(this.conviction + convictionAmount);
    }
    
    /**
     * Sets the conviction given a conviction amount.
     * 
     * @param newConviction the new conviction amount
     */
    public void setConviction(double newConviction) {
        this.conviction = newConviction;
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

    // TODO: check to update TeamInfo
    // also just everything else
    public void processEndOfTurn() {
        // bytecode stuff!
        this.gameWorld.getMatchMaker().addBytecodes(ID, this.bytecodesUsed);
        if (this.conviction > 0) 
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
