package battlecode.world.maps;

import battlecode.world.MapBuilder;

import battlecode.common.GameConstants;

import java.io.IOException;

/**
 * Generate a map.
 */
public class SoupOnTheSide {

    // change this!!!
    public static final String mapName = "SoupOnTheSide";

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
        MapBuilder mapBuilder = new MapBuilder(mapName, 48, 48, 219);
        mapBuilder.setWaterLevel(0);
        mapBuilder.setSymmetry(MapBuilder.MapSymmetry.rotational);
        mapBuilder.addSymmetricHQ(20, 20);

        mapBuilder.setSymmetricSoup(15, 15, 600);
        mapBuilder.setSymmetricSoup(16, 16, 600);
        mapBuilder.setSymmetricSoup(15, 16, 600);
        mapBuilder.setSymmetricSoup(16, 15, 600);
        mapBuilder.setSymmetricSoup(13, 15, 600);
        mapBuilder.setSymmetricSoup(13, 16, 600);
        mapBuilder.setSymmetricSoup(14, 15, 600);
        mapBuilder.setSymmetricSoup(14, 16, 600);
        mapBuilder.setSymmetricSoup(15, 13, 600);
        mapBuilder.setSymmetricSoup(16, 13, 600);
        mapBuilder.setSymmetricSoup(15, 14, 600);
        mapBuilder.setSymmetricSoup(16, 14, 600);
        mapBuilder.setSymmetricSoup(11, 15, 600);
        mapBuilder.setSymmetricSoup(11, 16, 600);
        mapBuilder.setSymmetricSoup(12, 15, 600);
        mapBuilder.setSymmetricSoup(12, 16, 600);
        mapBuilder.setSymmetricSoup(15, 12, 600);
        mapBuilder.setSymmetricSoup(16, 12, 600);
        mapBuilder.setSymmetricSoup(15, 11, 600);
        mapBuilder.setSymmetricSoup(16, 11, 600);
       /* mapBuilder.setSymmetricSoup(6, 6, 400);
        mapBuilder.setSymmetricSoup(5, 6, 400);
        mapBuilder.setSymmetricSoup(6, 5, 400);
        mapBuilder.setSymmetricSoup(5, 5, 400);*/

        mapBuilder.setSymmetricSoup(17, 19, 1200);
        mapBuilder.setSymmetricSoup(16, 20, 700);


        for(int i = 0; i < mapBuilder.width; i++) {
            for (int j = 0; j < mapBuilder.height; j++) {
                mapBuilder.setSymmetricDirt(i, j, 3);
            }
        }

        for(int i = 22; i < 26; i++) {
            for (int j = 22; j < 24; j++) {
                mapBuilder.setSymmetricDirt(i, j, 15);
            }
        }

        for (int i = 11; i <= 18; i++) {
            mapBuilder.setSymmetricDirt(i, 18, 15);
            mapBuilder.setSymmetricDirt(18, i, 15);
        }
        

        for(int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                mapBuilder.setSymmetricWater(i,j,true);
                mapBuilder.setSymmetricDirt(i,j,-1000);
            }
        }
        mapBuilder.setSymmetricDirt(0, 0, GameConstants.MIN_WATER_ELEVATION);
        mapBuilder.addSymmetricCow(12, 14);
        mapBuilder.addSymmetricCow(8, 18);

        mapBuilder.saveMap(outputDirectory);

    }
}
