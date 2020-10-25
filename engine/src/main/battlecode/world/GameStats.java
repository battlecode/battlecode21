package battlecode.world;

import battlecode.common.Team;

/**
 * Class to hold any game stats desired for a specific match
 * such as winner and domination factor
 */
public class GameStats {

    private Team winner;
    private DominationFactor dominationFactor;

    public GameStats() {
        this.winner = null;
        this.dominationFactor = null;
    }

    public void setWinner(Team t) {
        winner = t;
    }

    public void setDominationFactor(DominationFactor d) {
        dominationFactor = d;
    }

    public Team getWinner() {
        return winner;
    }

    public DominationFactor getDominationFactor() {
        return dominationFactor;
    }

}
