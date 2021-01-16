package battlecode.common;

/**
 * Defines constants that affect gameplay.
 */
@SuppressWarnings("unused")
public class GameConstants {

    /**
     * The current spec version the server compiles with.
     */
    public static final String SPEC_VERSION = "1.0";

    // *********************************
    // ****** MAP CONSTANTS ************
    // *********************************

    /** The minimum possible map height. */
    public static final int MAP_MIN_HEIGHT = 32;

    /** The maximum possible map height. */
    public static final int MAP_MAX_HEIGHT = 64;

    /** The minimum possible map width. */
    public static final int MAP_MIN_WIDTH = 32;

    /** The maximum possible map width. */
    public static final int MAP_MAX_WIDTH = 64;

    // *********************************
    // ****** GAME PARAMETERS **********
    // *********************************

    /** The number of indicator strings that a player can associate with a robot. */
    public static final int NUMBER_OF_INDICATOR_STRINGS = 3;

    /** The bytecode penalty that is imposed each time an exception is thrown. */
    public static final int EXCEPTION_BYTECODE_PENALTY = 500;

    ///** Maximum ID a Robot will have */
    //public static final int MAX_ROBOT_ID = 32000;   Cannot be guaranteed in Battlecode 2021.

    // *********************************
    // ****** COOLDOWNS ****************
    // *********************************
 

    // *********************************
    // ****** GAME MECHANICS ***********
    // *********************************

    /** The amount of conviction taxed when a Politician empowers. */
    public static final int EMPOWER_TAX = 10;

    /** The buff factor from exposing Slanderers. */
    public static final double EXPOSE_BUFF_FACTOR = 1.001;
    
    /** The number of rounds a buff is applied. */
    public static final int EXPOSE_BUFF_NUM_ROUNDS = 50;

    /** The number of rounds Slanderers generate influence. */
    public static final int EMBEZZLE_NUM_ROUNDS = 50;

    /** The scale factor in the Slanderer embezzle influence formula. */
    public static final float EMBEZZLE_SCALE_FACTOR = 0.03f;

    /** The exponential decay factor in the Slanderer embezzle influence formula. */
    public static final float EMBEZZLE_DECAY_FACTOR = 0.001f;

    /** The number of rounds before Slanderers turns into Politicians. */
    public static final int CAMOUFLAGE_NUM_ROUNDS = 300;

    /** The initial amount of influence for each player-owned Enlightenment Center. */
    public static final int INITIAL_ENLIGHTENMENT_CENTER_INFLUENCE = 150;

    /** The passive influence ratio for Enlightenment Centers. To multiply by sqrt(roundNum). */
    public static final float PASSIVE_INFLUENCE_RATIO_ENLIGHTENMENT_CENTER = 0.2f;

    /** Maximum allowable robot influence. */
    public static final int ROBOT_INFLUENCE_LIMIT = 100000000;

    /** The minimum allowable flag value. */
    public static final int MIN_FLAG_VALUE = 0;

    /** The maximum allowable flag value. */
    public static final int MAX_FLAG_VALUE = 16777215;

    // *********************************
    // ****** GAMEPLAY PROPERTIES ******
    // *********************************

    /** The default game seed. **/
    public static final int GAME_DEFAULT_SEED = 6370;

    /** The maximum number of rounds in a game.  **/
    public static final int GAME_MAX_NUMBER_OF_ROUNDS = 1500;
}
