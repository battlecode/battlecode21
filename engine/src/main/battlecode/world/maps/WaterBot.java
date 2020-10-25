package battlecode.world.maps;

import battlecode.world.MapBuilder;

import battlecode.common.GameConstants;

import java.io.IOException;

/**
 * Generate a map.
 */
public class WaterBot {

    // change this!!!
    public static final String mapName = "WaterBot";

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
        width = 61;
        height = 41;
        MapBuilder mapBuilder = new MapBuilder(mapName, width, height, 4444);
        mapBuilder.setWaterLevel(0);
        mapBuilder.setSymmetry(MapBuilder.MapSymmetry.vertical);
        mapBuilder.addSymmetricHQ(10, 10);

        // add HQ soup
        mapBuilder.setSymmetricSoup(13, 8, 1000);
        mapBuilder.setSymmetricSoup(13, 7, 100);
        mapBuilder.setSymmetricSoup(12, 8, 1000);
        mapBuilder.setSymmetricSoup(12, 7, 100);

        // add some nice central soup
        // add some team soup
        addSoup(mapBuilder, 10, 20, 4, 10);
        addSoup(mapBuilder, 20, 20, 4, 15);
        addSoup(mapBuilder, 15, 20, 4, 10);

        addRectangleSoup(mapBuilder, 10, 34, 17, 40, 50);

        for(int i = 0; i < mapBuilder.width; i++) {
            for (int j = 0; j < mapBuilder.height; j++) {
                mapBuilder.setSymmetricDirt(i, j, (int) (Math.min(50, 3+2*Math.min(Math.max(j,height-j-1),Math.min(i,width-i-1)))*.18));
            }
        }

        mapBuilder.addSymmetricCow(11,40);
        mapBuilder.addSymmetricCow(12,40);
        mapBuilder.addSymmetricCow(13,40);

        // add a river to make things interesting
        addRectangleDirt(mapBuilder, 28, 30, 32, 40, 3);

        // create 4 nice lakes
        // order matters here!! we want water level to be at -1 here.
        addLake(mapBuilder, 10, 20, 17, -20); // creates 2
        addLake(mapBuilder, 15, 25, 17, -20); // creates 2
        addLake(mapBuilder, 25, 25, 17, -20); // creates 2
        addLake(mapBuilder, 30, 10, 17, -20);
        addLake(mapBuilder, 30, 20, 17, -20);
        addLake(mapBuilder, 30, 30, 17, -20);


        mapBuilder.saveMap(outputDirectory);

    }

    public static void addRectangleDirt(MapBuilder mapBuilder, int xl, int yb, int xr, int yt, int v) {
        for (int i = xl; i < xr+1; i++) {
            for (int j = yb; j < yt+1; j++) {
                mapBuilder.setSymmetricDirt(i, j, v);
            }
        }
    }
    public static void addRectangleSoup(MapBuilder mapBuilder, int xl, int yb, int xr, int yt, int v) {
        for (int i = xl; i < xr+1; i++) {
            for (int j = yb; j < yt+1; j++) {
                mapBuilder.setSymmetricSoup(i, j, v);
            }
        }
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
                    if (xx >= width/2 && xx <= width/2+1 && yy >= height/2 && yy <= height/2+1) mapBuilder.setSymmetricDirt(xx, yy, GameConstants.MIN_WATER_ELEVATION);
                }
            }
        }
    }
}
