package battlecode.common;

/**
 * An exception caused by a robot's interaction with the game world.  For instance, trying to move
 * a robot into an occupied square will cause a <code>GameActionException</code> to be thrown.
 * <p>
 * Each <code>GameActionException</code> has a type that roughly identifies what
 * caused the exception.
 * <p>
 * In addition to <code>GameActionException</code>,
 * some robot functions can throw the unchecked exceptions
 * {@link IllegalStateException} and {@link IllegalArgumentException}.
 * An <code>IllegalStateException</code> is thrown if this robot can
 * never successfully call the function.
 * An <code>IllegalArgumentException</code> is thrown if this type of
 * robot can never successfully call the function with the given arguments.
 * A <code>GameActionException</code> is thrown in all other circumstances.
 */
public class GameActionException extends Exception {

    static final long serialVersionUID = 0x5def11da;
    private final GameActionExceptionType type;

    /**
     * Creates a GameActionException with the given type and message.
     * @param type the type of the GameActionException
     * @param message the error message
     */
    public GameActionException(GameActionExceptionType type, String message) {
        super(message);
        this.type = type;
    }

    /**
     * Gives the type of gameworld interaction that caused this GameActionException, which
     * was specified when this instance was constructed.
     *
     * @return this GameActionException's type.
     */
    public GameActionExceptionType getType() {
        return type;
    }
}
