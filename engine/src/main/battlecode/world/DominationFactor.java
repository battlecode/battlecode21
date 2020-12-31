package battlecode.world;

/**
 * Determines roughly by how much the winning team won.
 */
public enum DominationFactor {
    /**
     * Win by all enemy robots being destroyed (early end).
     */
    ANNIHILATED,
    /**
     * Win by more votes.
     */
    MORE_VOTES,
    /**
     * Win by having more Enlightenment Centers (tiebreak 1).
     */
    MORE_ENLIGHTENMENT_CENTERS,
    /**
     * Win by more total influence (tiebreak 2).
     */
    MORE_INFLUENCE,
    /**
     * Win by coinflip (tiebreak 3).
     */
    WON_BY_DUBIOUS_REASONS
}
