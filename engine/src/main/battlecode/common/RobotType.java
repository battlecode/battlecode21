package battlecode.common;

/**
 * Contains details on various attributes of the different robots. All of this information is in the specs in a more organized form.
 */
public enum RobotType {

    // spawnSource, minCost, convictionRatio, actionCooldown, actionRadius, detectRadius, identifyRadius, initInfluence, influencePerTurn, empowerBuff, buffDuration, bytecodeLimit
    /**
     * Enlightenment Centers produce various types of robots, as well as
     * passively generate influence and bid for votes each round. Can be
     * converted by Politicians.
     * 
     * @battlecode.doc.robottype
     */
    ENLIGHTENMENT_CENTER    (null,  0,  0,  1,  2,  2,  2,  10, 0.1f,   0,  0,  20000),
    //                       SS     MC  CR  AC  AR  DR  IR  II  IP      EB  BD  BL
    /**
     * Politicians convert enemy Politicians and Enlightenment Centers and
     * destroy enemy Slanderers and Muckrakers with their impassioned speeches.
     *
     * @battlecode.doc.robottype
     */
    POLITICIAN              (ENLIGHTENMENT_CENTER,  1,  1,  10, 2,  25, 25, 0,  0,  0,  0,  10000),
    //                       SS                     MC  CR  AC  AR  DR  IR  II  IP  EB  BD  BL
    /**
     * Slanderers passively generate influence for their parent Enlightenment
     * Center each round. They are camoflauged as Politicians to enemy units.
     * Can be converted by Politicians.
     *
     * @battlecode.doc.robottype
     */
    SLANDERER               (ENLIGHTENMENT_CENTER,  1,  1,  20, 0,  20, 20, 0,  0.1f,   0,  0,  10000),
    //                       SS                     MC  CR  AC  AR  DR  IR  II  IP      EB  BD  BL
    /**
     * Muckrakers search the map for enemy Slanderers to expose, which destroys
     * the Slanderer and generates   
     *
     * @battlecode.doc.robottype
     */
    MUCKRAKER               (ENLIGHTENMENT_CENTER,  1,  0.7f,   15, 12, 40, 30, 0,  0,  1.01f,  10,  10000),
    //                       SS                     MC  CR      AC  AR  DR  IR  II  IP  EB      BD  BL
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
    public final float actionCooldown;

    /**
     * Range of robots' abilities. For Politicians, this is
     * the AoE range of their empower ability. For Muckrakers,
     * this is from how far they can expose a Slanderer.
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
    public final int empowerBuffFactor;

    /**
     * The duration of the Muckraker's buff, in number of rounds.
     */
    public final int buffDuration;

    /**
     * Base bytecode limit of this robot.
     */
    public final int bytecodeLimit;


    /**
     * Returns whether the robot can build buildings.
     *
     * @param type the RobotType of the robot to get information on
     * @return whether the robot can build
     */
    public boolean canBuild(RobotType type) {
        return this == type.spawnSource;
    }

    /**
     * Returns whether the robot can refine crude soup into refined soup.
     *
     * @return whether the robot can refine crude soup into refined soup
     */
    public boolean canRefine() {
        return this == REFINERY || this == HQ;
    }

    /**
     * Returns whether the robot can affect pollution.
     *
     * @return whether the robot can affect pollution
     */
    public boolean canAffectPollution() {
        return this == REFINERY || this == VAPORATOR || this == HQ || this == COW;
    }

    /**
     * Returns whether the robot can move.
     *
     * @return whether the robot can move
     */
    public boolean canMove() {
        return this == MINER || this == LANDSCAPER || this == DELIVERY_DRONE || this == COW;
    }

    /**
     * Returns whether the robot can fly.
     *
     * @return whether the robot can fly
     */
    public boolean canFly() {
        return this == DELIVERY_DRONE;
    }

    /**
     * Returns whether the robot can dig.
     *
     * @return whether the robot can dig
     */
    public boolean canDig() {
        return this == LANDSCAPER;
    }

    /**
     * Returns whether the robot can deposit dirt.
     *
     * @return whether the robot can deposit dirt
     */
    public boolean canDepositDirt() {
        return this == LANDSCAPER;
    }

    /**
     * Returns whether the robot can mine.
     *
     * @return whether the robot can mine
     */
    public boolean canMine() {
        return this == MINER;
    }

    /**
     * Returns whether the robot can deposit soup.
     *
     * @return whether the robot can deposit soup
     */
    public boolean canDepositSoup() {
        return this == MINER;
    }

    /**
     * Returns whether the robot can shoot drones.
     *
     * @return whether the robot can shoot
     */
    public boolean canShoot() {
        return this == NET_GUN || this == HQ;
    }

    /**
     * Returns whether the robot can be shot.
     *
     * @return whether the robot can be shot
     */
    public boolean canBeShot() {
        return this == DELIVERY_DRONE;
    }

    /**
     * Returns whether the robot can pick up units.
     *
     * @return whether the robot can pick up units
     */
    public boolean canPickUpUnits() {
        return this == DELIVERY_DRONE;
    }

    /**
     * Returns whether the robot can drop off units.
     *
     * @return whether the robot can drop off units
     */
    public boolean canDropOffUnits() {
        return this == DELIVERY_DRONE;
    }

    /**
     * Returns whether the robot can be picked up.
     *
     * @return whether the robot can be picked up
     */
    public boolean canBePickedUp() {
        return this == MINER || this == LANDSCAPER || this == COW;
    }

    /**
     * Returns whether the robot is a building.
     * 
     * @return whether the robot is a building
     */
    public boolean isBuilding() {
        return (this == HQ || this == REFINERY || this == VAPORATOR ||
                this == DESIGN_SCHOOL || this == FULFILLMENT_CENTER ||
                this == NET_GUN);
    }

    RobotType(RobotType spawnSource, int cost, int dirtLimit, int soupLimit,
              float actionCooldown, int sensorRadiusSquared, int pollutionRadiusSquared, int localPollutionAdditiveEffect,
              float localPollutionMultiplicativeEffect,
              int globalPollutionAmount, int maxSoupProduced, int bytecodeLimit) {
        this.spawnSource           = spawnSource;
        this.cost                  = cost;
        this.dirtLimit             = dirtLimit;
        this.soupLimit             = soupLimit;
        this.actionCooldown        = actionCooldown;
        this.sensorRadiusSquared = sensorRadiusSquared;
        this.pollutionRadiusSquared = pollutionRadiusSquared;
        this.localPollutionAdditiveEffect = localPollutionAdditiveEffect;
        this.localPollutionMultiplicativeEffect = localPollutionMultiplicativeEffect;
        this.globalPollutionAmount = globalPollutionAmount;
        this.maxSoupProduced       = maxSoupProduced;
        this.bytecodeLimit         = bytecodeLimit;
    }
}
