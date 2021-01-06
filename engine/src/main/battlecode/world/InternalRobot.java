package battlecode.world;

import java.util.Arrays;
import java.util.ArrayList;
import battlecode.common.*;
import battlecode.schema.Action;

/**
 * The representation of a robot used by the server.
 * Comparable ordering:
 *  - tiebreak by creation time (priority to later creation)
 *  - tiebreak by robot ID (priority to lower ID)
 */
public strictfp class InternalRobot implements Comparable<InternalRobot> {
    private final RobotControllerImpl controller;
    private final GameWorld gameWorld;

    /**
     * The robot that built this robot.
     * Equal to null if this is an Enlightenment Center, because they are specified by the map.
     * This reference does not inhibit garbage collection because Enlightenment Centers never die.
     */
    private final InternalRobot parent;

    private final int ID;
    private Team team;
    private RobotType type;
    private MapLocation location;
    private int influence;
    private int conviction;
    private int convictionCap;
    private int flag;
    private int bid;

    private ArrayList<RobotInfo> toCreate;
    private ArrayList<InternalRobot> toCreateParents;

    private long controlBits;
    private int currentBytecodeLimit;
    private int bytecodesUsed;

    private int roundsAlive;
    private double cooldownTurns;

    /**
     * Used to avoid recreating the same RobotInfo object over and over.
     */
    private RobotInfo cachedRobotInfoTrue; // true RobotType included
    private RobotInfo cachedRobotInfoFake; // slanderers appear as politicians, null for all other robot types

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
    public InternalRobot(GameWorld gw, InternalRobot parent, int id, RobotType type, MapLocation loc, Team team, int influence) {
        this.parent = parent;
        this.ID = id;
        this.team = team;
        this.type = type;
        this.location = loc;
        this.influence = influence;
        this.conviction = (int) Math.ceil(this.type.convictionRatio * this.influence);
        this.convictionCap = type == RobotType.ENLIGHTENMENT_CENTER ? Integer.MAX_VALUE : this.conviction;
        this.flag = 0;
        this.bid = 0;

        this.toCreate = new ArrayList<>();
        this.toCreateParents = new ArrayList<>();

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

    public InternalRobot getParent() {
        return parent;
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

    public int getInfluence() {
        return influence;
    }

    public int getConviction() {
        return conviction;
    }

    public int getFlag() {
        return flag;
    }

    public int getBid() {
        return bid;
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

    public double getCooldownTurns() {
        return cooldownTurns;
    }

    public RobotInfo getRobotInfo(boolean trueSense) {
        RobotInfo cachedRobotInfo = this.cachedRobotInfoTrue;
        RobotType infoType = type;
        if (!trueSense && type == RobotType.SLANDERER) {
            cachedRobotInfo = this.cachedRobotInfoFake;
            infoType = RobotType.POLITICIAN;
        }

        if (cachedRobotInfo != null
                && cachedRobotInfo.ID == ID
                && cachedRobotInfo.team == team
                && cachedRobotInfo.type == infoType
                && cachedRobotInfo.influence == influence
                && cachedRobotInfo.conviction == conviction
                && cachedRobotInfo.location.equals(location)) {
            return cachedRobotInfo;
        }

        RobotInfo newRobotInfo = new RobotInfo(ID, team, infoType, influence, conviction, location);
        if (!trueSense && type == RobotType.SLANDERER) {
            this.cachedRobotInfoFake = newRobotInfo;
        } else {
            this.cachedRobotInfoTrue = newRobotInfo;
        }
        return newRobotInfo;
    }

    // **********************************
    // ****** CHECK METHODS *************
    // **********************************

    /**
     * Returns the robot's action radius squared.
     */
    public int getActionRadiusSquared() {
        return this.type.actionRadiusSquared;
    }

    /**
     * Returns the robot's sensor radius squared.
     */
    public int getSensorRadiusSquared() {
        return this.type.sensorRadiusSquared;
    }

    /**
     * Returns the robot's detection radius squared.
     */
    public int getDetectionRadiusSquared() {
        return this.type.detectionRadiusSquared;
    }

    /**
     * Returns whether this robot can perform actions on the given location.
     * 
     * @param toSense the MapLocation to act
     */
    public boolean canActLocation(MapLocation toSense){
        return this.location.distanceSquaredTo(toSense) <= getActionRadiusSquared();
    }

    /**
     * Returns whether this robot can sense the given location.
     * 
     * @param toSense the MapLocation to sense
     */
    public boolean canSenseLocation(MapLocation toSense){
        return this.location.distanceSquaredTo(toSense) <= getSensorRadiusSquared();
    }

    /**
     * Returns whether this robot can detect the given location.
     * 
     * @param toSense the MapLocation to detect
     */
    public boolean canDetectLocation(MapLocation toSense){
        return this.location.distanceSquaredTo(toSense) <= getDetectionRadiusSquared();
    }

    /**
     * Returns whether this robot can act at a given radius away.
     * 
     * @param radiusSquared the distance squared to act
     */
    public boolean canActRadiusSquared(int radiusSquared) {
        return radiusSquared <= getActionRadiusSquared();
    }

    /**
     * Returns whether this robot can sense something a given radius away.
     * 
     * @param radiusSquared the distance squared to sense
     */
    public boolean canSenseRadiusSquared(int radiusSquared) {
        return radiusSquared <= getSensorRadiusSquared();
    }

    /**
     * Returns whether this robot can detect something a given radius away.
     * 
     * @param radiusSquared the distance squared to detect
     */
    public boolean canDetectRadiusSquared(int radiusSquared) {
        return radiusSquared <= getDetectionRadiusSquared();
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
        double passability = this.gameWorld.getPassability(this.location);
        double newCooldownTurns = this.type.actionCooldown / passability;
        setCooldownTurns(this.cooldownTurns + newCooldownTurns);
    }

    /**
     * Adds influence given an amount to change this
     * robot's influence by. Input can be negative to
     * subtract influence. Conviction changes correspondingly.
     *
     * Only Enlightenment Centers should be able to change influence.
     * 
     * @param influenceAmount the amount to change influence by (can be negative)
     */
    public void addInfluenceAndConviction(int influenceAmount) {
        this.influence += influenceAmount;
        this.conviction = this.influence;
        this.gameWorld.getMatchMaker().addAction(getID(), Action.CHANGE_INFLUENCE, influenceAmount);
        this.gameWorld.getMatchMaker().addAction(getID(), Action.CHANGE_CONVICTION, influenceAmount);
    }
    
    /**
     * Sets the action cooldown given the number of turns.
     * 
     * @param newTurns the number of cooldown turns
     */
    public void setCooldownTurns(double newTurns) {
        this.cooldownTurns = newTurns;
    }

    /**
     * Adds conviction given an amount to change this
     * robot's conviction by. Input can be negative to
     * subtract conviction.
     * 
     * @param convictionAmount the amount to change conviction by (can be negative)
     */
    public void addConviction(int convictionAmount) {
        int oldConviction = this.conviction;
        this.conviction += convictionAmount;
        if (this.conviction > this.convictionCap)
            this.conviction = this.convictionCap;
        if (this.conviction != oldConviction)
            this.gameWorld.getMatchMaker().addAction(getID(), Action.CHANGE_CONVICTION, this.conviction - oldConviction);
    }

    /**
     * Sets the flag given a new flag value.
     *
     * @param newFlag the new flag value
     */
    public void setFlag(int newFlag) {
        this.flag = newFlag;
    }

    /**
     * Sets the bid given a new bid value.
     * The amount of influence bid is held hostage.
     *
     * @param newBid the new flag value
     */
    public void setBid(int newBid) {
        resetBid();
        this.bid = newBid;
        addInfluenceAndConviction(-this.bid);
    }

    public void resetBid() {
        addInfluenceAndConviction(this.bid);
        this.bid = 0;
    }

    public void addToCreate(InternalRobot parent, int ID, RobotType type, int influence, int conviction, MapLocation location) {
        this.toCreateParents.add(parent);
        this.toCreate.add(new RobotInfo(ID, this.team, type, influence, conviction, location));
    }

    /**
     * Empowers given a range. Doesn't self-destruct!!
     *
     * @param radiusSquared the empower range
     */
    public void empower(int radiusSquared) {
        InternalRobot[] robots = gameWorld.getAllRobotsWithinRadiusSquared(this.location, radiusSquared);
        int numBots = robots.length - 1; // excluding self
        if (numBots == 0)
            return;
        
        int convictionToGive = (int) (this.conviction * this.gameWorld.getTeamInfo().getBuff(this.team));
        convictionToGive -= GameConstants.EMPOWER_TAX;
        if (convictionToGive <= 0)
            return;
        
        int convictionPerBot = convictionToGive / numBots;
        int numBotsWithExtraConviction = convictionToGive % numBots;

        Arrays.sort(robots);
        for (InternalRobot bot : robots) {
            // check if this robot
            if (bot.equals(this))
                continue;
            int conv = convictionPerBot;
            if (numBotsWithExtraConviction > 0) {
                conv++;
                numBotsWithExtraConviction--;
            }
            bot.empowered(this, conv, this.team);
        }

        // create new bots
        for (int i = 0; i < toCreate.size(); i++) {
            RobotInfo info = toCreate.get(i);
            int id = this.gameWorld.spawnRobot(toCreateParents.get(i), info.getType(), info.getLocation(), this.team, info.getInfluence());
            InternalRobot newBot = this.gameWorld.getObjectInfo().getRobotByID(id);
            newBot.addConviction(info.getConviction() - newBot.getConviction());
            this.gameWorld.getMatchMaker().addAction(info.getID(), Action.CHANGE_TEAM, id);
        }
    }

    /**
     * Adds or removes influence, conviction, or both based on the type of the robot
     * and the robot's affiliation.
     * Called when a Politician Empowers.
     * If conviction becomes negative, the robot switches teams or is destroyed.
     *
     * @param amount the amount this robot is empowered by, must be positive
     * @param newTeam the team of the robot that empowered
     */
    public void empowered(InternalRobot caller, int amount, Team newTeam) {
        if (this.team != newTeam)
            amount = -amount;

        if (type == RobotType.ENLIGHTENMENT_CENTER)
            addInfluenceAndConviction(amount);
        else
            addConviction(amount);

        if (this.conviction < 0) {
            if (this.type.canBeConverted()) {
                int newInfluence = Math.abs(this.influence);
                int newConviction = -this.conviction;
                caller.addToCreate(this.parent, this.ID, this.type, newInfluence, newConviction, this.location);
            }
            this.gameWorld.destroyRobot(getID());
        }
    }

    /**
     * Empowers given a range. Doesn't self-destruct!!
     *
     * @param radiusSquared the empower range
     */
    public void expose(InternalRobot bot) {
        this.gameWorld.addBuffs(this.team, bot.influence);
        this.gameWorld.destroyRobot(bot.ID);
    }

    // *********************************
    // ****** GAMEPLAY METHODS *********
    // *********************************

    // should be called at the beginning of every round
    public void processBeginningOfRound() {
        // anything
    }

    public void processBeginningOfTurn() {
        if (this.cooldownTurns > 0)
            this.cooldownTurns = Math.max(0, this.cooldownTurns - 1);
        this.currentBytecodeLimit = getType().bytecodeLimit;
    }

    public void processEndOfTurn() {
        // bytecode stuff!
        this.gameWorld.getMatchMaker().addBytecodes(this.ID, this.bytecodesUsed);
        this.roundsAlive++;
    }

    public void processEndOfRound() {
        // generate passive influence
        InternalRobot target = (parent == null) ? this : parent;
        if (target.getType() != RobotType.ENLIGHTENMENT_CENTER) {
            throw new IllegalStateException("The robot's parent is not an Enlightenment Center");
        }
        int passiveInfluence = this.type.getPassiveInfluence(this.influence, this.roundsAlive, this.gameWorld.getCurrentRound());
        if (passiveInfluence > 0) {
            target.addInfluenceAndConviction(passiveInfluence);
            if (this.type == RobotType.SLANDERER) {
                this.gameWorld.getMatchMaker().addAction(this.ID, Action.EMBEZZLE, target.ID);
            }
        }

        // Slanderers turn into Politicians
        if (this.type == RobotType.SLANDERER && this.roundsAlive == GameConstants.CAMOUFLAGE_NUM_ROUNDS) {
            this.type = RobotType.POLITICIAN;
            this.gameWorld.getMatchMaker().addAction(this.ID, Action.CAMOUFLAGE, -1);
        }
    }

    // *********************************
    // ****** BYTECODE METHODS *********
    // *********************************

    // TODO
    public boolean canExecuteCode() {
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

    public void die_exception() {
        this.gameWorld.getMatchMaker().addAction(getID(), Action.DIE_EXCEPTION, -1);
        this.gameWorld.destroyRobot(getID());
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

    @Override
    public int compareTo(InternalRobot o) {
        if (this.roundsAlive != o.roundsAlive)
            return this.roundsAlive - o.roundsAlive;
        return this.ID - o.ID;
    }
}
