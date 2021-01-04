package battlecode.common;

/**
 * Struct that stores basic information that was 'sensed' of another Robot. This
 * info is ephemeral and there is no guarantee any of it will remain the same
 * between rounds.
 */
public class RobotInfo {

    /**
     * The unique ID of the robot.
     */
    public final int ID;

    /**
     * The Team that the robot is on.
     */
    public final Team team;

    /**
     * The type of the robot.
     */
    public final RobotType type;

    /**
     * The influence of the robot.
     */
    public final int influence;

    /**
     * The conviction of the robot.
     */
    public final int conviction;

    /**
     * The current location of the robot.
     */
    public final MapLocation location;

    public RobotInfo(int ID, Team team, RobotType type, int influence, int conviction, MapLocation location) {
        super();
        this.ID = ID;
        this.team = team;
        this.type = type;
        this.influence = influence;
        this.conviction = conviction;
        this.location = location;
    }

    /**
     * Returns the ID of this robot.
     *
     * @return the ID of this robot
     */
    public int getID() {
        return this.ID;
    }

    /**
     * Returns the team that this robot is on.
     *
     * @return the team that this robot is on.
     */
    public Team getTeam() {
        return team;
    }

    /**
     * Returns the type of this robot.
     *
     * @return the type of this robot.
     */
    public RobotType getType() {
        return type;
    }

    /**
     * Returns the influence of this robot.
     *
     * @return the influence of this robot
     */
    public int getInfluence() {
        return influence;
    }

    /**
     * Returns the conviction of this robot.
     *
     * @return the conviction of this robot
     */
    public int getConviction() {
        return conviction;
    }

    /**
     * Returns the location of this robot.
     *
     * @return the location of this robot
     */
    public MapLocation getLocation() {
        return this.location;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        RobotInfo robotInfo = (RobotInfo) o;

        if (ID != robotInfo.ID) return false;
        if (team != robotInfo.team) return false;
        if (type != robotInfo.type) return false;
        if (influence != robotInfo.influence) return false;
        if (conviction != robotInfo.conviction) return false;
        return location.equals(robotInfo.location);
    }

    @Override
    public int hashCode() {
        int result;
        result = ID;
        result = 31 * result + team.hashCode();
        result = 31 * result + type.ordinal();
        result = 31 * result + influence;
        result = 31 * result + conviction;
        result = 31 * result + location.hashCode();
        return result;
    }

    @Override
    public String toString() {
        return "RobotInfo{" +
                "ID=" + ID +
                ", team=" + team +
                ", type=" + type +
                ", influence=" + influence +
                ", conviction=" + conviction +
                ", location=" + location +
                '}';
    }
}
