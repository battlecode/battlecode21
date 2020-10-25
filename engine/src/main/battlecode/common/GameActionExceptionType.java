package battlecode.common;

/**
 * Enumerates the possible errors in GameWorld interactions that cause a GameActionException to be thrown.
 */
public enum GameActionExceptionType {

    /**
     * Internal error in the GameWorld engine.	 This is bad.
     */
    INTERNAL_ERROR,
    /**
     * Indicates when a robot tries to perform an action for which it does not have enough resources.
     */
    NOT_ENOUGH_RESOURCE,
    /**
     * Indicates when a robot tries to move into a non-empty location.
     */
    CANT_MOVE_THERE,
    /**
     * Indicates when a robot tries to execute an action, but is not currently idle.
     */
    IS_NOT_READY,
    /**
     * Indicates when a robot tries to sense a robot that no longer exists or is no longer
     * in this robot's sensor range.
     */
    CANT_SENSE_THAT,
    /**
     * Indicates when a robot tries to perform an action on a location that is outside
     * its range.
     */
    OUT_OF_RANGE,
    /**
     * Indicates when a robot tries to perform an action it can't.
     */
    CANT_DO_THAT,
    /**
     * Indicates when a robot tries to pick up a unit but can't.
     */
    CANT_PICK_UP_UNIT,
    /**
     * Indicates when a robot tries to perform an action on another robot, but there is
     * no suitable robot there.
     */
    NO_ROBOT_THERE,
    /**
     * Indicates when a robot tries to send too many messages to the blockchain.
     */
    TOO_LONG_BLOCKCHAIN_TRANSACTION,
    /**
     * Indicates when round number is out of range.
     */
    ROUND_OUT_OF_RANGE
}
