package battlecode.server;

import battlecode.common.GameConstants;
import battlecode.common.MapLocation;
import battlecode.common.RobotType;
import battlecode.common.Team;
import battlecode.schema.Event;
import battlecode.schema.GameHeader;
import battlecode.schema.GameWrapper;
import battlecode.util.TeamMapping;
import battlecode.world.TestMapBuilder;

import org.apache.commons.io.IOUtils;
import org.junit.Test;
import org.mockito.Mockito;


import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.zip.GZIPInputStream;

import static org.junit.Assert.*;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

/**
 * @author james
 */
public class GameMakerTest {
    private final GameInfo info = new GameInfo(
                    "bananas", "org.bananas", null,
                    "yellow","org.yellow", null,
                    new String[] {"honolulu"}, null, false
    );

    @Test(expected=RuntimeException.class)
    public void testStateExceptions() {
        GameMaker gm = new GameMaker(info, null);

        gm.makeGameFooter(Team.A);
    }

    @Test(expected=RuntimeException.class)
    public void testMatchStateExceptions() {
        GameMaker gm = new GameMaker(info, null);
        gm.makeGameHeader();
        gm.getMatchMaker().makeMatchFooter(Team.A, 23);
    }
    @Test
    public void fullReasonableGame() throws Exception {
        NetServer mockServer = Mockito.mock(NetServer.class);
        GameMaker gm = new GameMaker(info, mockServer);

        gm.makeGameHeader();
        GameMaker.MatchMaker mm = gm.getMatchMaker();
        mm.makeMatchHeader(new TestMapBuilder("honolulu", 2, -3, 50, 50, 1337, 50, 0)
                .addRobot(0, Team.A, RobotType.HQ, new MapLocation(0, 0))
                .addRobot(1, Team.B, RobotType.HQ, new MapLocation(25, 25))
                .setSoup()
                .setWater()
                .setPollution()
                .setDirt()
                .build());
        mm.addMoved(0, new MapLocation(1, 1));
        mm.makeRound(0);
        mm.addDied(0);
        mm.makeRound(1);
        mm.makeMatchFooter(Team.B, 2);

        GameMaker.MatchMaker mm2 = gm.getMatchMaker();
        mm2.makeMatchHeader(new TestMapBuilder("argentina", 55, 3, 58, 50, 1337, 50, 0)
                .addRobot(0, Team.A, RobotType.HQ, new MapLocation(0, 0))
                .addRobot(1, Team.B, RobotType.HQ, new MapLocation(25, 25))
                .setSoup()
                .setWater()
                .setPollution()
                .setDirt()
                .build());
        mm2.makeRound(0);
        mm2.makeMatchFooter(Team.A, 1);
        gm.makeGameFooter(Team.A);

        byte[] gameBytes = ungzip(gm.toBytes());

        GameWrapper output = GameWrapper.getRootAsGameWrapper(ByteBuffer.wrap(gameBytes));

        assertEquals(9, output.eventsLength());
        assertEquals(2, output.matchHeadersLength());
        assertEquals(2, output.matchFootersLength());

        assertEquals(Event.GameHeader, output.events(0).eType());

        GameHeader h = (GameHeader) output.events(0).e(new GameHeader());
        assertEquals(GameConstants.SPEC_VERSION, h.specVersion());
        assertEquals(2, h.teamsLength());

        assertEquals(TeamMapping.id(Team.A), h.teams(0).teamID());
        assertEquals("bananas", h.teams(0).name());
        assertEquals("org.bananas", h.teams(0).packageName());

        assertEquals(TeamMapping.id(Team.B), h.teams(1).teamID());
        assertEquals("yellow", h.teams(1).name());
        assertEquals("org.yellow", h.teams(1).packageName());

        // TODO more sanity checking

        assertEquals(Event.MatchHeader, output.events(1).eType());
        assertEquals(Event.Round, output.events(2).eType());
        assertEquals(Event.Round, output.events(3).eType());
        assertEquals(Event.MatchFooter, output.events(4).eType());
        assertEquals(Event.MatchHeader, output.events(5).eType());
        assertEquals(Event.Round, output.events(6).eType());
        assertEquals(Event.MatchFooter, output.events(7).eType());
        assertEquals(Event.GameFooter, output.events(8).eType());

        // make sure we sent something to the mock server
        verify(mockServer, times(9)).addEvent(any(byte[].class));
    }

    public byte[] ungzip(byte[] in) throws IOException {
        ByteArrayOutputStream result = new ByteArrayOutputStream();
        IOUtils.copy(new GZIPInputStream(new ByteArrayInputStream(in)), result);
        result.flush();
        return result.toByteArray();
    }
}
