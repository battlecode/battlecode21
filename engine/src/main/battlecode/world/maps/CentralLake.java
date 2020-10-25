package battlecode.world.maps;

import battlecode.world.MapBuilder;

import battlecode.common.GameConstants;

import java.io.IOException;

/**
 * Generate a map.
 */
public class CentralLake {

    // change this!!!
    public static final String mapName = "CentralLake";

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
        MapBuilder mapBuilder = new MapBuilder(mapName, 41, 41, 432);
        mapBuilder.setWaterLevel(0);
        mapBuilder.setSymmetry(MapBuilder.MapSymmetry.rotational);
        mapBuilder.addSymmetricHQ(7, 7);

        // add soup close to HQ
        mapBuilder.setSymmetricSoup(9, 9, 1000);
        mapBuilder.setSymmetricSoup(9, 8, 1000);
        mapBuilder.setSymmetricSoup(8, 9, 1000);
        mapBuilder.setSymmetricSoup(8, 8, 1000);

        mapBuilder.addSymmetricCow(36,36);
        mapBuilder.addSymmetricCow(35,35);

        for (int i = 17; i < mapBuilder.width-17; i++) {
            for (int j = 0; j < 3; j++) {
                mapBuilder.setSymmetricSoup(i, j, 200*(j+1));
            }
        }


        for(int i = 0; i < mapBuilder.width; i++) {
            for (int j = 0; j < mapBuilder.height; j++) {
                mapBuilder.setSymmetricDirt(i, j,  3);
            }
        }
        for(int i = 10; i < mapBuilder.width-10; i++) {
            for (int j = 10; j < mapBuilder.height-10; j++) {
                mapBuilder.setSymmetricWater(i,j,true);
                mapBuilder.setSymmetricDirt(i,j,-5);
            }
        }

        mapBuilder.setSymmetricDirt(9, 9, 2);
        mapBuilder.setSymmetricDirt(9, 8, 2);
        mapBuilder.setSymmetricDirt(8, 9, 2);
        mapBuilder.setSymmetricDirt(8, 8, 2);

        mapBuilder.setSymmetricDirt(20,20,GameConstants.MIN_WATER_ELEVATION);
        mapBuilder.saveMap(outputDirectory);

    }
}
