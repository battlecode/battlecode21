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
public class Quadrants {

    // change this!!!
    public static final String mapName = "quadrants";

    // don't change this!!
    public static final String outputDirectory = "engine/src/main/battlecode/world/resources/";

    /**
     * @param args unused
     */
    public static void main(String[] args) {
        try {
            makeQuadrants();
        } catch (IOException e) {
            System.out.println(e);
        }
        System.out.println("Generated a map!");
    }

    public static void makeQuadrants() throws IOException {
        MapBuilder mapBuilder = new MapBuilder(mapName, 40, 40, 13265, 17387, 215957);
        mapBuilder.setSymmetry(MapBuilder.MapSymmetry.rotational);
        mapBuilder.addSymmetricEnlightenmentCenter(5, 5);
        mapBuilder.addSymmetricEnlightenmentCenter(10, 30);
        mapBuilder.addSymmetricNeutralEnlightenmentCenter(18, 19, 500);

        for (int i = 5; i <= 15; i++) {
            mapBuilder.setSymmetricPassability(i, 15, 0.1);
            mapBuilder.setSymmetricPassability(i, 25, 0.1);
            mapBuilder.setSymmetricPassability(15, i, 0.1);
            mapBuilder.setSymmetricPassability(25, i, 0.1);
        }

        mapBuilder.saveMap(outputDirectory);
    }
}
