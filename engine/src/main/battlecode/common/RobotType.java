package battlecode.common;

/**
 * Contains details on various attributes of the different robots. All of this information is in the specs in a more organized form.
 */
public enum RobotType {

    // spawnSource, convictionRatio, actionCooldown, actionRadiusSquared, sensorRadiusSquared, detectionRadiusSquared, bytecodeLimit
    /**
     * Enlightenment Centers produce various types of robots, as well as
     * passively generate influence and bid for votes each round. Can be
     * converted by Politicians.
     * 
     * @battlecode.doc.robottype
     */
    ENLIGHTENMENT_CENTER    (null,  1,  2,  2,  40,  40,  20000),
    //                       SS     CR  AC  AR  SR   DR   BL
    /**
     * Politicians Empower adjacent units, strengthening friendly robots, 
     * converting enemy Politicians and Enlightenment Centers, and destroying
     * enemy Slanderers and Muckrakers with their impassioned speeches.
     *
     * @battlecode.doc.robottype
     */
    POLITICIAN              (ENLIGHTENMENT_CENTER,  1,  1,  9,  25,  25,  10000),
    //                       SS                     CR  AC  AR  SR   DR   BL
    /**
     * Slanderers passively generate influence for their parent Enlightenment
     * Center each round. They are camoflauged as Politicians to enemy units.
     * Can be converted by Politicians.
     *
     * @battlecode.doc.robottype
     */
    SLANDERER               (ENLIGHTENMENT_CENTER,  1,  2,  0,  20,  20,  10000),
    //                       SS                     CR  AC  AR  SR   DR   BL
    /**
     * Muckrakers search the map for enemy Slanderers to Expose, which destroys
     * the Slanderer and gives a buff to their team.
     *
     * @battlecode.doc.robottype
     */
    MUCKRAKER               (ENLIGHTENMENT_CENTER,  0.7f,  1.5,  12,  30,  40,  10000),
    //                       SS                     CR     AC    AR   SR   DR   BL
    ;
    
    /**
     * For units, this is the structure that spawns it. For non-spawnable robots, this is null.
     */
    public final RobotType spawnSource;

    /**
     * The ratio of influence to apply when determining the
     * robot's conviction.
     */
    public final float convictionRatio;

    /**
     * Cooldown turns for how long before a robot can take 
     * action (Build/Move/Empower/Expose) again.
     */
    public final float actionCooldown;

    /**
     * Radius squared range of robots' abilities. For Politicians, this is
     * the AoE range of their Empower ability. For Muckrakers, this is
     * from how far they can Expose a Slanderer.
     */
    public final int actionRadiusSquared;

    /**
     * The radius squared range in which the robot can sense another
     * robot's information. For Politicians, Slanderers, and
     * Enlightenment Centers, this is the same as their detection
     * radius squared. For Muckrakers, slightly reduced.
     */
    public final int sensorRadiusSquared;

    /**
     * The radius squared range in which the robot can detect the presence
     * of other robots.
     */
    public final int detectionRadiusSquared;

    /**
     * Base bytecode limit of this robot.
     */
    public final int bytecodeLimit;

    /**
     * Returns whether the type can build robots of the specified type.
     *
     * @param type the RobotType to be built
     * @return whether the type can build robots of the specified type
     */
    public boolean canBuild(RobotType type) {
        return this == type.spawnSource;
    }

    /**
     * Returns whether the type can distinguish slanderers and politicians.
     *
     * @return whether the type can distinguish slanderers and politicians.
     */
    public boolean canTrueSense() {
        return this == ENLIGHTENMENT_CENTER || this == MUCKRAKER;
    }

    /**
     * Returns whether the type can apply a teamwide buff.
     *
     * @return whether the type can apply a teamwide buff
     */
    public boolean canBuffTeam() {
        return this == MUCKRAKER;
    }

    /**
     * Returns whether the type can move.
     *
     * @return whether the type can move
     */
    public boolean canMove() {
        return this == POLITICIAN || this == SLANDERER || this == MUCKRAKER;
    }

    /**
     * Returns whether the type can Empower adjacent units.
     *
     * @return whether the type can Empower adjacent units
     */
    public boolean canEmpower() {
        return this == POLITICIAN;
    }

    /**
     * Returns whether the type can camouflage themselves.
     *
     * @return whether the type can camouflage themselves
     */
    public boolean canCamouflage() {
        return this == SLANDERER;
    }

    /**
     * Returns whether the type can Expose nearby robots.
     *
     * @return whether the type can Expose nearby robots
     */
    public boolean canExpose() {
        return this == MUCKRAKER;
    }

    /**
     * Returns whether the type can be Exposed.
     *
     * @return whether the type can be Exposed
     */
    public boolean canBeExposed() {
        return this == SLANDERER;
    }

    /**
     * Returns whether the type can be converted to the other team.
     *
     * @return whether the type can be converted to the other team
     */
    public boolean canBeConverted() {
        return this == ENLIGHTENMENT_CENTER || this == POLITICIAN;
    }

    /**
     * Returns whether the type can submit a bid.
     * 
     * @return whether the type can submit a bid
     */
    public boolean canBid() {
        return this == ENLIGHTENMENT_CENTER;
    }

    /**
     * Returns the influence cost for building a robot with a particular conviction.
     */
    public int getInfluenceCostForConviction(int conviction) {
        int influence = (int) (conviction / this.convictionRatio);
        while (Math.ceil(this.convictionRatio * (influence - 1)) >= conviction)
            influence--;
        return influence;
    }

    RobotType(RobotType spawnSource, float convictionRatio, float actionCooldown,
              int actionRadiusSquared, int sensorRadiusSquared, int detectionRadiusSquared,
              int bytecodeLimit) {
        this.spawnSource            = spawnSource;
        this.convictionRatio        = convictionRatio;
        this.actionCooldown         = actionCooldown;
        this.actionRadiusSquared    = actionRadiusSquared;
        this.sensorRadiusSquared    = sensorRadiusSquared;
        this.detectionRadiusSquared = detectionRadiusSquared;
        this.bytecodeLimit          = bytecodeLimit;
    }
}