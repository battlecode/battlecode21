package battlecode.world.maps;

import battlecode.common.MapLocation;
import battlecode.common.RobotType;
import battlecode.common.Team;
import battlecode.world.GameMapIO;
import battlecode.world.LiveMap;
import battlecode.world.MapBuilder;
import battlecode.world.TestMapBuilder;

import battlecode.common.GameConstants;

import java.io.File;
import java.io.IOException;
import java.util.Random;

/**
 * Generate a map.
 */
public class MapTestSmall {

    // change this!!!
    public static final String mapName = "maptestsmall";

    // don't change this!!
    public static final String outputDirectory = "engine/src/main/battlecode/world/resources/";

    /**
     * @param args unused
     */
    public static void main(String[] args) {
        try {
            makeSimple();
        } catch (IOException e) {
            System.out.println(e);
        }
        System.out.println("Generated a map!");
    }

    public static void makeSimple() throws IOException {
        MapBuilder mapBuilder = new MapBuilder(mapName, 32, 32, 30);
        mapBuilder.addSymmetricEnlightenmentCenter(5, 5);
        Random random = new Random(6147);

        for(int i = 0; i < mapBuilder.width / 2; i++) {
            for (int j = 0; j < mapBuilder.height; j++) {
                mapBuilder.setSymmetricPassability(i, j, random.nextDouble()*0.9+0.1);
            }
        }

        mapBuilder.saveMap(outputDirectory);
    }
}
