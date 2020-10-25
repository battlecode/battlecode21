package battlecode.world;

import battlecode.world.maps.*;

import java.io.IOException;

/**
 * Generate a map.
 */
public class BuildMaps {


    // don't change this!!
    public static final String outputDirectory = "engine/src/main/battlecode/world/resources/";

    /**
     * @param args unused
     */
    public static void main(String[] args) {
        ALandDivided.main(args);
        CentralLake.main(args);
        CentralSoup.main(args);
        FourLakeLand.main(args);
        SoupOnTheSide.main(args);
        TwoForOneAndTwoForAll.main(args);
        WaterBot.main(args);
    }

}
