package battlecode.world;

import battlecode.common.GameConstants;
import battlecode.common.Team;
import java.util.*;

/**
 * This class is used to hold information regarding team specific values such as
 * team names, and victory points.
 */
public class TeamInfo {

    private GameWorld gameWorld;
    private int[] teamVotes;

    public TeamInfo(GameWorld gameWorld) {
        this.gameWorld = gameWorld;
        this.teamVotes = new int[2];
    }

    // *********************************
    // ***** GETTER METHODS ************
    // *********************************

    // Breaks if t.ordinal() > 1 (Team NEUTRAL)
    public int getVotes(Team t) {
        return teamVotes[t.ordinal()];
    }

    // *********************************
    // ***** UPDATE METHODS ************
    // *********************************

    public void addVote(Team t) {
        teamVotes[t.ordinal()]++;
    }
}
