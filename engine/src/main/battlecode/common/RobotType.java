package battlecode.common;

/**
 * Contains details on various attributes of the different robots. All of this information is in the specs in a more organized form.
 */
public enum RobotType {

    // spawnSource, soupCost, dirtLimit, soupLimit, actionCooldown, sensorRadius, pollutionRadius, pollutionAdditive, pollutionMultiplicative, globalPollution, maxSoup, bytecodeLimit
    /**
     * The base produces miners, is also a net gun and a refinery.
     * @battlecode.doc.robottype
     */
    HQ                      (null,  0,  50,  0,  1,  48,  35,  500,  1,  1,  20,  20000),
    //                       SS     C   DL   SL  AC  SR   PR   PA   PM  GP  MS   BL
    /**
     * Miners extract crude soup and bring it to the refineries.
     *
     * @battlecode.doc.robottype
     */
    MINER                   (HQ,  70,  0,  100,  1,  35,  0,  0,  1,  0,  0,  10000),
    //                       SS   C    DL  SL   AC  SR   PR  PA  PM  GP  MS  BL
    /**
     * Refineries turn crude soup into refined soup, and produce pollution.
     * @battlecode.doc.robottype
     */
    REFINERY                (MINER,  200,  15,  0,  1,  24,  35,  500, 1,  1,  20,  5000),
    //                       SS      C     DL   SL  AC  SR   PR   PA   PM  GP  MS   BL
    /**
     * Vaporators condense soup from the air, reducing pollution.
     * @battlecode.doc.robottype
     */
    VAPORATOR               (MINER,  1000,  15,  0,  1,  24,  35,  0,  0.67f,  -1,  7,  5000),
    //                       SS      C      DL   SL  AC  SR   PR   PA  PM      GP   MS   BL
    /**
     * Design schools create landscapers.
     * @battlecode.doc.robottype
     */
    DESIGN_SCHOOL           (MINER,  150,  15,  0,  1,  24,  0,  0,  1,  0,  0,  5000),
    //                       SS      C     DL   SL  AC  SR   PR  PA  PM  GP  MS  BL
    /**
     * Fulfillment centers create drones.
     * @battlecode.doc.robottype
     */
    FULFILLMENT_CENTER      (MINER,  150,  15,  0,  1,  24,  0,  0,  1,  0,  0,  5000),
    //                       SS      C     DL   SL  AC  SR   PR  PA  PM  GP  MS  BL
    /**
     * Landscapers take dirt from adjacent squares (decreasing the elevation)
     * or deposit dirt onto adjacent squares, including
     * into water (increasing the elevation).
     * @battlecode.doc.robottype
     */
    LANDSCAPER              (DESIGN_SCHOOL,  150,  25,  0,  1,  24,  0,  0,  1,  0,  0,  10000),
    //                       SS              C     DL   SL  AC  SR   PR  PA  PM  GP  MS  BL
    /**
     * Drones pick up any unit and drop them somewhere else.
     * @battlecode.doc.robottype
     */
    DELIVERY_DRONE          (FULFILLMENT_CENTER,  150,  0,  0,  1.5f,  24,  0,  0,  1,  0,  0,  10000),
    //                       SS                   C     DL  SL  AC     SR   PR  PA  PM  GP  MS  BL
    /**
     * Net guns shoot down drones.
     * @battlecode.doc.robottype
     */
    NET_GUN                 (MINER,  250,  15,  0,  1,  24,  0,  0,  1,  0,  0,  7000),
    //                       SS      C     DL   SL  AC  SR   PR  PA  PM  GP  MS  BL
    /**
     * Cows produce pollution (and they moo).
     * @battlecode.doc.robottype
     */
    COW                     (null,  0,  0,  0,  2,  10000,  15,  2000,  1,  0,  0,  0),
    //                       SS     C   DL  SL  AC  SR     PR   PA     PM  GP  MS  BL
    ;
    
    /**
     * For units, this is the structure that spawns it. For non-spawnable robots, this is null.
     */
    public final RobotType spawnSource;

    /**
     * Cost for creating the robot.
     */
    public final int cost;

    /**
     * Limit for amount of dirt robot can hold.
     */
    public final int dirtLimit;

    /**
     * Limit for amount of crude soup robot can hold.
     */
    public final int soupLimit;

    /**
     * Cooldown turns for how long before a robot can take 
     * action (build, move, dig, drop, mine, shoot) again.
     */
    public final float actionCooldown;

    /**
     * Range for sensing robots and trees.
     */
    public final int sensorRadiusSquared;

    /**
     * The radius of local pollution effects.
     */
    public final int pollutionRadiusSquared;

    /**
     * Amount of pollution created when refining soup locally.
     */
    public final int localPollutionAdditiveEffect;

    /**
     * The fraction that the local pollution is multiplied by around vaporators.
     */
    public final float localPollutionMultiplicativeEffect;

    /**
     * Amount of global pollution created when refining soup.
     */
    public final int globalPollutionAmount;

    /**
     * Maximum amount of soup to be refined per turn.
     */
    public final int maxSoupProduced;

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
