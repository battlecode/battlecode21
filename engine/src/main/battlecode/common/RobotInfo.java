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
     * The influence of the robot.
     */
    public final double influence;

    /**
     * The conviction of the robot.
     */
    public final double conviction;

    /**
     * The current location of the robot.
     */
    public final MapLocation location;

    public RobotInfo(int ID, Team team, double influence, double conviction, MapLocation location) {
        super();
        this.ID = ID;
        this.team = team;
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
     * Returns the influence of this robot.
     *
     * @return the influence of this robot
     */
    public double getInfluence() {
        return influence;
    }

    /**
     * Returns the conviction of this robot.
     *
     * @return the conviction of this robot
     */
    public double conviction() {
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
        if (influence != robotInfo.influence) return false;
        if (conviction != robotInfo.conviction) return false;
        return location.equals(robotInfo.location);
    }

    @Override
    public int hashCode() {
        int result;
        result = ID;
        result = 31 * result + team.hashCode();
        result = 31 * result + Double.hashCode(influence);
        result = 31 * result + Double.hashCode(conviction);
        result = 31 * result + location.hashCode();
        return result;
    }

    @Override
    public String toString() {
        return "RobotInfo{" +
                "ID=" + ID +
                ", team=" + team +
                ", influence=" + influence +
                ", conviction=" + conviction +
                ", location=" + location +
                '}';
    }
}
