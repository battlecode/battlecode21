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
public class Circle {

    // change this!!!
    public static final String mapName = "circle";

    // don't change this!!
    public static final String outputDirectory = "engine/src/main/battlecode/world/resources/";

    /**
     * @param args unused
     */
    public static void main(String[] args) {
        try {
            makeCircle();
        } catch (IOException e) {
            System.out.println(e);
        }
        System.out.println("Generated a map!");
    }

    public static void makeCircle() throws IOException {
        final int half = 31;
        final MapLocation center = new MapLocation(half, half);
        MapBuilder mapBuilder = new MapBuilder(mapName, 2*half+1, 2*half+1, 25016, 12865, 116896);
        mapBuilder.addSymmetricEnlightenmentCenter(20, 20);
        mapBuilder.addSymmetricEnlightenmentCenter(20, 2*half-20);
        mapBuilder.addSymmetricNeutralEnlightenmentCenter(0, 0, 300);
        mapBuilder.addSymmetricNeutralEnlightenmentCenter(0, 2*half, 300);

        for(int i = 0; i <= half; i++) {
            for (int j = 0; j <= 2*half; j++) {
                int d = new MapLocation(i, j).distanceSquaredTo(center);
                mapBuilder.setSymmetricPassability(i, j,
                        1.0 - 0.5 * Math.exp(-0.0002 * (d - 500) * (d - 500)));
            }
        }

        mapBuilder.saveMap(outputDirectory);
    }
}
