package battlecode.common;

/**
 * This enumeration represents a direction from one MapLocation to another.
 * There is a direction for each of the cardinals (north, south, east, west),
 * each of the diagonals (northwest, southwest, northeast, southeast), and
 * no direction (center).
 * <p>
 * Since Direction is a Java 1.5 enum, you can use it in <code>switch</code>
 * statements, it has all the standard enum methods (<code>valueOf</code>,
 * <code>values</code>, etc.), and you can safely use <code>==</code> for
 * equality tests.
 */
public enum Direction {
    /**
     * Direction that represents pointing north (up on screen).
     */
    NORTH(0, 1),
    /**
     * Direction that represents pointing northeast (up and to the right on screen).
     */
    NORTHEAST(1, 1),
    /**
     * Direction that represents pointing east (right on screen).
     */
    EAST(1, 0),
    /**
     * Direction that represents pointing southeast (down and to the right on screen).
     */
    SOUTHEAST(1, -1),
    /**
     * Direction that represents pointing south (down on screen).
     */
    SOUTH(0, -1),
    /**
     * Direction that represents pointing southwest (down and to the left on screen).
     */
    SOUTHWEST(-1, -1),
    /**
     * Direction that represents pointing west (left on screen).
     */
    WEST(-1, 0),
    /**
     * Direction that represents pointing northwest (up and to the left on screen).
     */
    NORTHWEST(-1, 1),
    /**
     * Direction that represents pointing nowhere.
     */
    CENTER(0, 0);

    /**
     * Change in x, change in y.
     */
    public final int dx, dy;

    Direction(int dx, int dy) {
        this.dx = dx;
        this.dy = dy;
    }

    /**
     * Computes the direction opposite this one.
     *
     * @return the direction pointing in the opposite direction to this one
     *
     * @battlecode.doc.costlymethod
     */
    public Direction opposite() {
        if (ordinal() >= 8)
            return this; // center
        return Direction.values()[(ordinal() + 4) % 8];
    }

    /**
     * Computes the direction 45 degrees to the left (counter-clockwise)
     * of this one.
     *
     * @return the direction 45 degrees left of this one
     *
     * @battlecode.doc.costlymethod
     */
    public Direction rotateLeft() {
        if (ordinal() >= 8)
            return this; // center
        return Direction.values()[(ordinal() + 8 - 1) % 8];
    }

    /**
     * Computes the direction 45 degrees to the right (clockwise)
     * of this one.
     *
     * @return the direction 45 degrees right of this one
     *
     * @battlecode.doc.costlymethod
     */
    public Direction rotateRight() {
        if (ordinal() >= 8)
            return this; // center
        return Direction.values()[(ordinal() + 1) % 8];
    }

    /**
     * Returns a list of all directions. This is equivalent to calling
     * Direction.values().
     *
     * @return array of all directions.
     */
    public static Direction[] allDirections() {
        return Direction.values();
    }

    /**
     * Returns a list of all cardinal directions.
     *
     * @return array of all cardinal directions.
     */
    public static Direction[] cardinalDirections() {
        return new Direction[]{Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST};
    }

    /**
     * Returns the delta X of the direction.
     *
     * @return the delta X of the direction.
     */
    public int getDeltaX() {
        return this.dx;
    }

    /**
     * Returns the delta Y of the direction.
     *
     * @return the delta Y of the direction.
     */
    public int getDeltaY() {
        return this.dy;
    }
}