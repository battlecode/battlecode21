package battlecode.common;

/**
 * Contains details on various attributes of the different robots. All of this information is in the specs in a more organized form.
 */
public enum RobotType {

    // spawnSource, minCost, convictionRatio, actionCooldown, actionRadius, detectRadius, identifyRadius, initInfluence, influencePerTurn, buffFactor, buffDuration, bytecodeLimit
    /**
     * Enlightenment Centers produce various types of robots, as well as
     * passively generate influence and bid for votes each round. Can be
     * converted by Politicians.
     * 
     * @battlecode.doc.robottype
     */
    ENLIGHTENMENT_CENTER    (null,  0,  0,  1,  2,  2,  2,  10, 0.1f,   0,  0,  20000),
    //                       SS     MC  CR  AC  AR  DR  IR  II  IP      BF  BD  BL
    /**
     * Politicians Empower adjacent units, strengthening friendly robots, 
     * converting enemy Politicians and Enlightenment Centers, and destroying
     * enemy Slanderers and Muckrakers with their impassioned speeches.
     *
     * @battlecode.doc.robottype
     */
    POLITICIAN              (ENLIGHTENMENT_CENTER,  1,  1,  10, 2,  25, 25, 0,  0,  0,  0,  10000),
    //                       SS                     MC  CR  AC  AR  DR  IR  II  IP  BF  BD  BL
    /**
     * Slanderers passively generate influence for their parent Enlightenment
     * Center each round. They are camoflauged as Politicians to enemy units.
     * Can be converted by Politicians.
     *
     * @battlecode.doc.robottype
     */
    SLANDERER               (ENLIGHTENMENT_CENTER,  1,  1,  20, 0,  20, 20, 0,  0.1f,   0,  0,  10000),
    //                       SS                     MC  CR  AC  AR  DR  IR  II  IP      BF  BD  BL
    /**
     * Muckrakers search the map for enemy Slanderers to Expose, which destroys
     * the Slanderer and generates   
     *
     * @battlecode.doc.robottype
     */
    MUCKRAKER               (ENLIGHTENMENT_CENTER,  1,  0.7f,   15, 12, 40, 30, 0,  0,  1.01f,  10,  10000),
    //                       SS                     MC  CR      AC  AR  DR  IR  II  IP  BF      BD  BL
    ;
    
    /**
     * For units, this is the structure that spawns it. For non-spawnable robots, this is null.
     */
    public final RobotType spawnSource;

    /**
     * Minimum influence (cost) one can expend to create the robot.
     */
    public final int minCost;

    /**
     * The ratio of influence^2 to apply when determining the
     * robot's conviction.
     */
    public final float convictionRatio;

    /**
     * Cooldown turns for how long before a robot can take 
     * action (build/Empower/Expose) again.
     */
    public final int actionCooldown;

    /**
     * Range of robots' abilities. For Politicians, this is
     * the AoE range of their Empower ability. For Muckrakers,
     * this is from how far they can Expose a Slanderer.
     */
    public final int actionRadiusSquared;

    /**
     * The radius in which the robot can detect the presence
     * of other robots.
     */
    public final int detectionRadiusSquared;

    /**
     * The radius in which the robot can identify another
     * robot's type. For Politicians and Slanderers, same as
     * their detection radius. For Muckrakers, slightly reduced.
     */
    public final int identificationRadiusSquared;

    /**
     * Amount of influence units start with. Zero for all units
     * except Centers of Enlightenment.
     */
    public final int initialInfluence;

    /**
     * The amount of influence a unit generates per turn.
     */
    public final float influencePerTurn;

    /**
     * The amount that Muckrakers buff their team's empowers.
     * Calculated by empowerBuffFactor^(Muckraker influence).
     */
    public final float empowerBuffFactor;

    /**
     * The duration of the Muckraker's buff, in number of rounds.
     */
    public final int buffDuration;

    /**
     * Base bytecode limit of this robot.
     */
    public final int bytecodeLimit;


    /**
     * Returns whether the unit can build robots.
     *
     * @return whether the robot can build
     */
    public boolean canBuild() {
        return this == ENLIGHTENMENT_CENTER;
    }

    /**
     * Returns whether the unit can generate per-turn influence.
     *
     * @return whether the unit can generate per-turn influence
     */
    public boolean canGenerateInfluence() {
        return this == ENLIGHTENMENT_CENTER || this == SLANDERER;
    }

    /**
     * Returns whether the robot can apply a teamwide buff.
     *
     * @return whether the robot can apply a teamwide buff
     */
    public boolean canBuffTeam() {
        return this == MUCKRAKER;
    }

    /**
     * Returns whether the robot can move.
     *
     * @return whether the robot can move
     */
    public boolean canMove() {
        return this == POLITICIAN || this == SLANDERER || this == MUCKRAKER;
    }

    /**
     * Returns whether the robot can Empower adjacent units.
     *
     * @return whether the robot can Empower adjacent units
     */
    public boolean canEmpower() {
        return this == POLITICIAN;
    }

    /**
     * Returns whether the robot can camouflage themselves.
     *
     * @return whether the robot can camouflage themselves
     */
    public boolean canCamouflage() {
        return this == SLANDERER;
    }

    /**
     * Returns whether the robot can Expose nearby robots.
     *
     * @return whether the robot can Expose nearby robots
     */
    public boolean canExpose() {
        return this == MUCKRAKER;
    }

    /**
     * Returns whether the robot can be Exposed.
     *
     * @return whether the robot can be Exposed
     */
    public boolean canBeExposed() {
        return this == SLANDERER;
    }

    /**
     * Returns whether the robot can be converted to the other team.
     *
     * @return whether the robot can be converted to the other team
     */
    public boolean canBeConverted() {
        return this == ENLIGHTENMENT_CENTER || this == POLITICIAN;
    }

    /**
     * Returns whether the robot is a building.
     * 
     * @return whether the robot is a building
     */
    public boolean isBuilding() {
        return (this == ENLIGHTENMENT_CENTER);
    }

    RobotType(RobotType spawnSource, int minCost, float convictionRatio, int actionCooldown,
              int actionRadiusSquared, int detectionRadiusSquared, int identificationRadiusSquared,
              int initialInfluence, float influencePerTurn, float empowerBuffFactor, int buffDuration, int bytecodeLimit) {
        this.spawnSource            = spawnSource;
        this.minCost                = minCost;
        this.convictionRatio        = convictionRatio;
        this.actionCooldown         = actionCooldown;
        this.actionRadiusSquared    = actionRadiusSquared;
        this.detectionRadiusSquared = detectionRadiusSquared;
        this.identificationRadiusSquared = identificationRadiusSquared;
        this.initialInfluence       = initialInfluence;
        this.influencePerTurn       = influencePerTurn;
        this.empowerBuffFactor      = empowerBuffFactor;
        this.buffDuration           = buffDuration;
        this.bytecodeLimit          = bytecodeLimit;
    }
}

    /** 
     * RobotType spawnSource;
     * int minCost;
     * float convictionRatio;
     * int actionCooldown;
     * int actionRadiusSquared;
     * int detectionRadiusSquared;
     * int identificationRadiusSquared;
     * int initialInfluence;
     * float influencePerTurn;
     * float empowerBuffFactor;
     * int buffDuration;
     * int bytecodeLimit;
     */