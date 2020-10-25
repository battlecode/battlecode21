package battlecode.world;

/**
 * Determines roughly by how much the winning team won.
 */
public enum DominationFactor {
    /**
     * Win by coin flip (tiebreak 5).
     */
    WON_BY_DUBIOUS_REASONS,
    /**
     * Win by highest robot ID (tiebreak 4).
     */
    HIGHBORN,
    /**
     * Win by more successful broadcasts (tiebreak 3).
     */
    GOSSIP_GIRL,
    /**
     * Win by having higher net worth: soup + soup costs of robots (tiebreak 2).
     */
    QUALITY_OVER_QUANTITY,
    /**
     * Win by having more robots (tiebreak 1).
     */
    QUANTITY_OVER_QUALITY,
    /**
     * Win by enemy HQ being destroyed.
     */
    HQ_DESTROYED
}
