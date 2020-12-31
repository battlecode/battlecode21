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
    private int[] numBuffs;
    private Map<Integer, TreeMap<Integer, Integer>> buffExpirations; // team -> round number, number of buffs expiring at the beginning of that round

    public TeamInfo(GameWorld gameWorld) {
        this.gameWorld = gameWorld;
        this.teamVotes = new int[2];
        this.numBuffs = new int[2];
        this.buffExpirations = new HashMap<>();
        for (int i = 0; i < 2; i++)
            this.buffExpirations.put(i, new TreeMap<>());
    }

    // *********************************
    // ***** GETTER METHODS ************
    // *********************************

    // Breaks if t.ordinal() > 1 (Team NEUTRAL)
    public int getVotes(Team t) {
        return this.teamVotes[t.ordinal()];
    }

    // returns current buff
    public double getBuff(Team t) {
        return Math.pow(GameConstants.EXPOSE_BUFF_FACTOR, this.numBuffs[t.ordinal()]);
    }

    // returns the buff at specified round
    public double getBuff(Team t, int roundNumber) {
        int buffs = getNumBuffs(t, roundNumber);
        return Math.pow(GameConstants.EXPOSE_BUFF_FACTOR, buffs);
    }

    // returns the number of buffs at specified round
    private double getNumBuffs(Team t, int roundNumber) {
        int teamIdx = t.ordinal();
        int buffs = numBuffs[teamIdx];
        TreeMap<Integer, Integer> map = this.buffExpirations.get(teamIdx);
        for (int round : map.keySet()) {
            if (round <= roundNumber) {
                buffs -= map.get(round);
            } else {
                break; // treemaps are in increasing order
            }
        }
        return buffs;
    }

    // *********************************
    // ***** UPDATE METHODS ************
    // *********************************

    public void addVote(Team t) {
        teamVotes[t.ordinal()]++;
    }

    // called at the end of every round
    public void addBuffs(int nextRound, Team t, int buffs) {
        int teamIdx = t.ordinal();
        this.numBuffs[teamIdx] += buffs;
        TreeMap<Integer, Integer> map = this.buffExpirations.get(teamIdx);
        int expirationRound = nextRound + GameConstants.EXPOSE_BUFF_NUM_ROUNDS;
        map.put(expirationRound, map.getOrDefault(expirationRound, 0) + buffs);
    }

    // called at the beginning of every round
    public void updateNumBuffs(int currentRound) {
        updateNumBuffs(currentRound, Team.A);
        updateNumBuffs(currentRound, Team.B);
    }

    private void updateNumBuffs(int currentRound, Team t) {
        int teamIdx = t.ordinal();
        TreeMap<Integer, Integer> map = this.buffExpirations.get(teamIdx);
        for (int round : map.keySet()) {
            if (round <= currentRound) {
                this.numBuffs[teamIdx] -= map.remove(round);
            } else {
                break; // treemaps are in increasing order
            }
        }
    }
}
