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
    // more instance variables, typically array of length 2

    public TeamInfo(GameWorld gameWorld) {
        this.gameWorld = gameWorld;
    }

    // All methods should all be with signature
    // ```public void doSomething(Team t)```
    // Possibly with more parameters
    // Use t.ordinal() for indexing, breaks if t.ordinal() > 1 (Team NEUTRAL)

    // *********************************
    // ***** GETTER METHODS ************
    // *********************************

    // *********************************
    // ***** UPDATE METHODS ************
    // *********************************
}
