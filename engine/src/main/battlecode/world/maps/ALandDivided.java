package battlecode.world.maps;

import battlecode.world.MapBuilder;

import battlecode.common.GameConstants;

import java.io.IOException;

/**
 * Generate a map.
 */
public class ALandDivided {

    // change this!!!
    public static final String mapName = "ALandDivided";

    // don't change this!!
    public static final String outputDirectory = "engine/src/main/battlecode/world/resources/";

    private static int width;
    private static int height;

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
        width = 41;
        height = 32;
        MapBuilder mapBuilder = new MapBuilder(mapName, width, height, 118811);
        mapBuilder.setWaterLevel(0);
        mapBuilder.setSymmetry(MapBuilder.MapSymmetry.vertical);
        mapBuilder.addSymmetricHQ(5, 26);

        addRectangleDirt(mapBuilder, 0, 0, 40,31,3);

        // add soup near HQ
        mapBuilder.setSymmetricSoup(7,28,500);
        mapBuilder.setSymmetricSoup(8,28,1000);
        mapBuilder.setSymmetricSoup(7,29,500);
        mapBuilder.setSymmetricSoup(8,29,1000);

        mapBuilder.addSymmetricCow(0,0);


        // add one soup location
        mapBuilder.setSymmetricSoup(5,5,1000);
        mapBuilder.setSymmetricSoup(6,5,1000);
        mapBuilder.setSymmetricSoup(5,6,1000);
        mapBuilder.setSymmetricSoup(6,6,1000);

        // add a river to make things interesting
        addRectangleWater(mapBuilder, 19, 0, 21, 31, -100);
        mapBuilder.saveMap(outputDirectory);

    }

    public static void addRectangleDirt(MapBuilder mapBuilder, int xl, int yb, int xr, int yt, int v) {
        for (int i = xl; i < xr+1; i++) {
            for (int j = yb; j < yt+1; j++) {
                mapBuilder.setSymmetricDirt(i, j, v);
            }
        }
    }

    public static void addRectangleWater(MapBuilder mapBuilder, int xl, int yb, int xr, int yt, int v) {
        for (int i = xl; i < xr+1; i++) {
            for (int j = yb; j < yt+1; j++) {
                mapBuilder.setSymmetricWater(i, j, true);
                mapBuilder.setSymmetricDirt(i,j, v);
            }
        }
        mapBuilder.setSymmetricDirt((xl + xr)/2, (yb + yt)/2, GameConstants.MIN_WATER_ELEVATION);
    }


    /*
     * Add a nice circular lake centered at (x,y).
     */
    public static void addSoup(MapBuilder mapBuilder, int x, int y, int r2, int v) {
        for (int xx = 0; xx < width; xx++) {
            for (int yy = 0; yy < height; yy++) {
                int d = (xx-x)*(xx-x)/2 + (yy-y)*(yy-y);
                if (d <= r2) {
                    mapBuilder.setSymmetricSoup(xx, yy, v*(d+v));
                }
            }
        }
    }

    /*
     * Add a nice circular lake centered at (x,y).
     */
    public static void addLake(MapBuilder mapBuilder, int x, int y, int r2, int v) {
        for (int xx = 0; xx < width; xx++) {
            for (int yy = 0; yy < height; yy++) {
                int d = (xx-x)*(xx-x) + (yy-y)*(yy-y);
                if (d <= r2) {
                    mapBuilder.setSymmetricWater(xx, yy, true);
                    mapBuilder.setSymmetricDirt(xx, yy, v);
                }
            }
        }
    }
}
