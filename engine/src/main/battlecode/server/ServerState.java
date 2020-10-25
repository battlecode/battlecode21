package battlecode.server;

/**
 * Represents the state of a match in a running server.
 */
public enum ServerState {

    /**
     * The match is not ready for running yet.
     */
    NOT_READY,

    /**
     * The match is ready to start running.
     */
    READY,

    /**
     * The match is running.
     */
    RUNNING,

    /**
     * The match is paused.
     */
    PAUSED,

    /**
     * The match has finished running.
     */
    FINISHED,

    /**
     * The match could not be run because the server experienced an error.
     */
    ERROR
}
