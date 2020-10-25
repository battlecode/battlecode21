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
        mapBuilder.setWaterLevel(0);
        mapBuilder.addSymmetricHQ(5, 5);
        mapBuilder.addSymmetricCow(10, 10);
        mapBuilder.addSymmetricCow(4, 18);

        for(int i = 0; i < mapBuilder.width; i++) {
            for (int j = 0; j < mapBuilder.height; j++) {
                mapBuilder.setSymmetricSoup(i, j,  i * j + i + j);
            }
        }

        for(int i = 0; i < mapBuilder.width/2; i++) {
            for (int j = 0; j < mapBuilder.height; j++) {
                mapBuilder.setSymmetricWater(i, j,  false);
                if (i < 4 && j < 4) {
                    mapBuilder.setSymmetricWater(i,j,true);
                }
            }
        }

        for(int i = 0; i < mapBuilder.width/2; i++) {
            for (int j = 0; j < mapBuilder.height; j++) {
                mapBuilder.setSymmetricDirt(i, j,  3);
                if (i < 16 && j < 8) {
                    mapBuilder.setSymmetricDirt(i,j,2);
                }
                if (i < 8 && j < 8) {
                    mapBuilder.setSymmetricDirt(i,j,1);
                }
            }
        }

        mapBuilder.setSymmetricDirt(2, 2, GameConstants.MIN_WATER_ELEVATION);
        mapBuilder.saveMap(outputDirectory);

    }
}
