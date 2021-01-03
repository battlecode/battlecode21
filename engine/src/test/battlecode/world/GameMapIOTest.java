package battlecode.world;

import battlecode.common.*;
import org.junit.Test;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

import static org.junit.Assert.*;

public class GameMapIOTest {

    final static ClassLoader loader = GameMapIOTest.class.getClassLoader();

    // @Test
    // public void testFindsDefaultMap() throws IOException {
    //     // will throw exception if default map can't be loaded
    //     GameMapIO.loadMap("maptestsmall", null);
    // }

    // @Test
    // public void testFindsPackageMap() throws IOException {
    //     LiveMap readMap = GameMapIO.loadMapAsResource(loader,
    //             "battlecode/world/resources", "clearMap");
    //     assertEquals(readMap.getMapName(), "clearMap");
    //     assertEquals(readMap.getHeight(), 50.0, 0);
    //     assertEquals(readMap.getWidth(), 50.0, 0);
    //     assertEquals(readMap.getSeed(), 128);
    //     assertEquals(readMap.getOrigin().x, 0.0, 0);
    //     assertEquals(readMap.getOrigin().y, 0.0, 0);
    // }

    // @Test
    // public void testRoundTrip() throws IOException {
    //     LiveMap inputMap = new TestMapBuilder("simple", 55, 3, 58, 50, 1337, 50)
    //             .addEnlightenmentCenter(0, Team.A, GameConstants.INITIAL_ENLIGHTENMENT_CENTER_INFLUENCE, new MapLocation(0, 0))
    //             .addEnlightenmentCenter(1, Team.B, GameConstants.INITIAL_ENLIGHTENMENT_CENTER_INFLUENCE, new MapLocation(25, 25))
    //             .build();

    //     LiveMap outputMap = GameMapIO.Serial.deserialize(GameMapIO.Serial.serialize(inputMap));

    //     assertEquals("Round trip failed", inputMap, outputMap);
    // }
}
