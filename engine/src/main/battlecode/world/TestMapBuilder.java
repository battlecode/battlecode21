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
    private double[] passabilityArray;

    private List<RobotInfo> bodies;

    public TestMapBuilder(String name, int oX, int oY, int width, int height, int seed, int rounds) {
        this(name, new MapLocation(oX, oY), width, height, seed, rounds);
    }

    public TestMapBuilder(String name, MapLocation origin, int width, int height, int seed, int rounds) {
        this.name = name;
        this.origin = origin;
        this.width = width;
        this.height = height;
        this.seed = seed;
        this.bodies = new ArrayList<>();
    }

    public TestMapBuilder addCOE(int id, Team team, int influence, MapLocation loc){
        bodies.add(new RobotInfo(
                id,
                team,
                influence,
                0,
                loc
        ));

        return this;
    }
    
    public TestMapBuilder setPassability() {
        this.passabilityArray = new int[width*height];
        for(int i = 0; i < width; i++) {
            for (int j = 0; j < height; j++) {
                this.passabilityArray[i + j * width] = (i * j + i + j) / (i * j + 1);
            }
        }
        return this;
    }

    public TestMapBuilder addBody(RobotInfo info) {
        bodies.add(info);
        return this;
    }

    public LiveMap build() {
        return new LiveMap(width, height, origin, seed, GameConstants.GAME_MAX_NUMBER_OF_ROUNDS, name, bodies.toArray(new RobotInfo[bodies.size()]), passabilityArray);
    }
}
