package battlecode.instrumenter;

/**
 * An exception used to indicate that there was a problem instrumenting a player (e.g., the player references a
 * disallowed class, or one if its classes can't be found).  This must be an unchecked Exception, because it
 * has to be thrown in overriden methods.
 *
 * @author adamd
 */
public class InstrumentationException extends RuntimeException {

    public enum Type {
        ILLEGAL,
        MISSING
    }

    public final Type type;

    public InstrumentationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public InstrumentationException(Type type, String message, Throwable cause) {
        super(message, cause);
        this.type = type;
    }

    @Override
    public String getMessage() {
        return type + " " + super.getMessage();
    }

}
