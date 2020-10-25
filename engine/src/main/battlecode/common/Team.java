package battlecode.common;

/**
 * This enum represents the team of a robot. A robot is on exactly one team.
 * Player robots are on either team A or team B.
 * <p>
 * Since Team is a Java 1.5 enum, you can use it in <code>switch</code>
 * statements, it has all the standard enum methods (<code>valueOf</code>,
 * <code>values</code>, etc.), and you can safely use <code>==</code> for
 * equality tests.
 */
public enum Team {
    /**
     * Team A.
     */
    A,
    /**
     * Team B.
     */
    B,
    /**
     * Neutral robots.
     */
    NEUTRAL;

    /**
     * Determines the team that is the opponent of this team.
     *
     * @return the opponent of this team.
     *
     * @battlecode.doc.costlymethod
     */
    public Team opponent() {
        switch (this) {
            case A:
                return B;
            case B:
                return A;
            default:
                return NEUTRAL;
        }
    }

    /**
     * Returns whether a robot of this team is a player-controlled entity
     * (team A or team B).
     *
     * @return true a robot of this team is player-controlled; false otherwise.
     *
     * @battlecode.doc.costlymethod
     */
    public boolean isPlayer() {
        return this == A || this == B;
    }
}
