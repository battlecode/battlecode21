package battlecode.world;

import battlecode.common.GameConstants;
import battlecode.common.MapLocation;
import battlecode.common.RobotType;
import battlecode.common.Team;
import org.junit.Ignore;
import org.junit.Test;

import java.io.File;
import java.io.IOException;

/**
 * @author james
 *
 * so uh
 *
 * this exists
 */
@Ignore
public class GenerateMaps {
    @Test
    public void makeSimple() throws IOException {
        LiveMap map = new TestMapBuilder("maptest", 0, 0, 100, 100, 30, 3000)
                .addEnlightenmentCenter(
                        0,
                        Team.A,
                        GameConstants.INITIAL_ENLIGHTENMENT_CENTER_INFLUENCE,
                        new MapLocation(
                                1,
                                1
                        )
                )
                .addEnlightenmentCenter(
                        1,
                        Team.B,
                        GameConstants.INITIAL_ENLIGHTENMENT_CENTER_INFLUENCE,
                        new MapLocation(
                                99,
                                99
                        )
                )
                .build();
        GameMapIO.writeMap(map, new File("/Users/ezou/dev/battlecode20/engine/src/main/battlecode/world/maptest"));
        LiveMap test = GameMapIO.loadMap("maptest", new File("/Users/ezou/dev/battlecode20/engine/src/main/battlecode/world/resources"));
        // System.out.println(test.toString());
    }
}
