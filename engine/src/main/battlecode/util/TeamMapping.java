package battlecode.util;

import battlecode.common.Team;

import java.util.EnumMap;
import java.util.Map;

/**
 * Utility
 *
 * @author james
 */
public final class TeamMapping {
    private static final Map<Team, Byte> teamsToIds = new EnumMap<>(Team.class);
    static {
        teamsToIds.put(Team.NEUTRAL, (byte)0);
        teamsToIds.put(Team.A, (byte)1);
        teamsToIds.put(Team.B, (byte)2);
    }
    private static final Team[] idsToTeams = {Team.NEUTRAL, Team.A, Team.B};

    /**
     * Get the team for a team ID
     */
    public static Team team(byte id) {
        return idsToTeams[id];
    }

    /**
     * Get the ID for a team
     */
    public static byte id(Team team) {
        return teamsToIds.get(team);
    }
}
