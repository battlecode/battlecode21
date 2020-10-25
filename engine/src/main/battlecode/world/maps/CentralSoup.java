package battlecode.world.maps;

import battlecode.world.MapBuilder;

import battlecode.common.GameConstants;

import java.io.IOException;

/**
 * Generate a map.
 */
public class CentralSoup {

    // change this!!!
    public static final String mapName = "CentralSoup";

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
        mapBuilder.addSymmetricHQ(10, 10);

        addRectangleSoup(mapBuilder,2,2,6,6,100);


        mapBuilder.setSymmetricSoup(23, 20, 2000);
        mapBuilder.setSymmetricSoup(24, 20, 2000);

        for (int i = 22; i <= 25; i++) {
            for (int j = 22; j <= 25; j++) {
                mapBuilder.setSymmetricSoup(i, j, 800);
                mapBuilder.setSymmetricDirt(i, j, -1000);
            }
        }

        for(int i = 0; i < mapBuilder.width; i++) {
            for (int j = 0; j < mapBuilder.height; j++) {
                mapBuilder.setSymmetricDirt(i, j,  3);
            }
        }

        for (int i = 21; i <= 26; i++) {
            mapBuilder.setSymmetricDirt(i, 21, 15);
            mapBuilder.setSymmetricDirt(i, 26, 15);
            mapBuilder.setSymmetricDirt(21, i, 15);
            mapBuilder.setSymmetricDirt(26, i, 15);
        }
        

        for(int i = 0; i < mapBuilder.width; i++) {
            for (int j = 0; j < 1; j++) {
                mapBuilder.setSymmetricWater(i,j,true);
                mapBuilder.setSymmetricDirt(i, j, -25);
                if (i == mapBuilder.width/2) mapBuilder.setSymmetricDirt(i,j,GameConstants.MIN_WATER_ELEVATION);
            }
        }

        mapBuilder.addSymmetricCow(12, 14);
        mapBuilder.addSymmetricCow(8, 18);

        mapBuilder.saveMap(outputDirectory);

    }

    public static void addRectangleSoup(MapBuilder mapBuilder, int xl, int yb, int xr, int yt, int v) {
        for (int i = xl; i < xr+1; i++) {
            for (int j = yb; j < yt+1; j++) {
                mapBuilder.setSymmetricSoup(i, j, v);
            }
        }
    }
}
