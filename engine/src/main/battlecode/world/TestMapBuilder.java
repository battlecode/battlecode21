package battlecode.world;

import battlecode.common.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Lets maps be built easily, for testing purposes.
 */
public class TestMapBuilder {
    private String name;
    private MapLocation origin;
    private int width;
    private int height;
    private int seed;
    private int rounds;
    private int[] soupArray;
    private int[] pollutionArray;
    private boolean[] waterArray;
    private int[] dirtArray;
    private int initialWater;

    private List<RobotInfo> bodies;

    public TestMapBuilder(String name, int oX, int oY, int width, int height, int seed, int rounds, int initialWater) {
        this(name, new MapLocation(oX, oY), width, height, seed, rounds, initialWater);
    }

    public TestMapBuilder(String name, MapLocation origin, int width, int height, int seed, int rounds, int initialWater) {
        this.name = name;
        this.origin = origin;
        this.width = width;
        this.height = height;
        this.seed = seed;
        this.bodies = new ArrayList<>();
        this.initialWater = initialWater;
    }

    public TestMapBuilder addRobot(int id, Team team, RobotType type, MapLocation loc){
        bodies.add(new RobotInfo(
                id,
                team,
                type,
                loc
        ));

        return this;
    }
    
    public TestMapBuilder setSoup() {
        this.soupArray = new int[width*height];
        for(int i = 0; i < width; i++) {
            for (int j = 0; j < height; j++) {
                this.soupArray[i + j * width] = i * j + i + j;
            }
        }
        return this;
    }
    
    public TestMapBuilder setPollution() {
        this.pollutionArray = new int[width*height];
        for(int i = 0; i < width; i++) {
            for (int j = 0; j < height; j++) {
                this.pollutionArray[i + j * width] = 0;
            }
        }
        return this;
    }

    public TestMapBuilder setWater() {
        this.waterArray = new boolean[width*height];
        for(int i = 0; i < width; i++) {
            for (int j = 0; j < height; j++) {
                this.waterArray[i + j * width] = false;
                if (i < 4 && j < 4) {
                    this.waterArray[i + j * width] = true;
                }
            }
        }
        return this;
    }

  public TestMapBuilder setDirt() {
        this.dirtArray = new int[width*height];
        for(int i = 0; i < width; i++) {
            for (int j = 0; j < height; j++) {
                this.dirtArray[i + j * width] = 3;
                if (i < 16 && j < 8) {
                    this.dirtArray[i + j * width] = 2;
                }
                if (i < 8 && j < 8) {
                    this.dirtArray[i + j * width] = 1;
                }
            }
        }
        return this;
    }

    public TestMapBuilder addBody(RobotInfo info) {
        bodies.add(info);
        return this;
    }

    public LiveMap build() {
        return new LiveMap(width, height, origin, seed, GameConstants.GAME_MAX_NUMBER_OF_ROUNDS, name, bodies.toArray(new RobotInfo[bodies.size()]), soupArray, pollutionArray, waterArray, dirtArray, initialWater);
    }
}
