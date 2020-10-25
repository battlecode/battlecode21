package battlecode.server;

import battlecode.common.GameConstants;
import battlecode.common.MapLocation;
import battlecode.common.RobotType;
import battlecode.common.Team;
import battlecode.schema.*;
import battlecode.util.FlatHelpers;
import battlecode.util.TeamMapping;
import battlecode.world.*;
import com.google.flatbuffers.FlatBufferBuilder;
import gnu.trove.list.array.TByteArrayList;
import gnu.trove.list.array.TFloatArrayList;
import gnu.trove.list.array.TIntArrayList;
import gnu.trove.list.array.TCharArrayList;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;

import java.io.*;
import java.nio.ByteBuffer;
import java.util.function.ToIntFunction;
import java.util.zip.GZIPOutputStream;

import static battlecode.util.FlatHelpers.*;

/**
 * Writes a game to a flatbuffer, hooray.
 */
public strictfp class GameMaker {

    /**
     * The protocol expects a series of valid state transitions;
     * we ensure that's true.
     */
    private enum State {
        /**
         * Waiting to write game header.
         */
        GAME_HEADER,
        /**
         * In a game, but not a match.
         */
        IN_GAME,
        /**
         * In a match.
         */
        IN_MATCH,
        /**
         * Complete.
         */
        DONE
    }
    private State state;

    // this un-separation-of-concerns makes me uncomfortable

    /**
     * We write the whole match to this builder, then write it to a file.
     */
    private final FlatBufferBuilder fileBuilder;

    /**
     * Null until the end of the match.
     */
    private byte[] finishedGame;

    /**
     * We have a separate byte[] for each packet sent to the client.
     * This is necessary because flatbuffers shares metadata between structures, so we
     * can't just cut out chunks of the larger buffer :/
     */
    private FlatBufferBuilder packetBuilder;

    /**
     * The server we're sending packets on.
     * May be null.
     */
    private final NetServer packetSink;

    /**
     * Information about the active game.
     */
    private final GameInfo gameInfo;

    /**
     * Only relevant to the file builder:
     * We add a table called a GameWrapper to the front of the saved files
     * that lets you quickly navigate to events by index, and tells you the
     * indices of headers and footers.
     */
    private TIntArrayList events;
    private TIntArrayList matchHeaders;
    private TIntArrayList matchFooters;

    /**
     * The MatchMaker associated with this GameMaker.
     */
    private final MatchMaker matchMaker;

    /**
     * @param gameInfo the mapping of teams to bytes
     * @param packetSink the NetServer to send packets to
     */
    public GameMaker(final GameInfo gameInfo, final NetServer packetSink){
        this.state = State.GAME_HEADER;

        this.gameInfo = gameInfo;

        this.packetSink = packetSink;
        if (packetSink != null) {
            this.packetBuilder = new FlatBufferBuilder();
        }

        this.fileBuilder = new FlatBufferBuilder();

        this.events = new TIntArrayList();
        this.matchHeaders = new TIntArrayList();
        this.matchFooters = new TIntArrayList();

        this.matchMaker = new MatchMaker();
    }

    /**
     * Assert we're in a particular state.
     *
     * @param state
     */
    private void assertState(State state) {
        if (this.state != state) {
            throw new RuntimeException("Incorrect GameMaker state: should be "+
                    state+", but is: "+this.state);
        }
    }

    /**
     * Make a state transition.
     */
    private void changeState(State start, State end) {
        assertState(start);
        this.state = end;
    }


    /**
     * Convert entire game to a byte array.
     *
     * @return game as a packed flatbuffer byte array.
     */
    public byte[] toBytes() {
        if (finishedGame == null) {
            assertState(State.DONE);

            int events = offsetVector(fileBuilder, this.events, GameWrapper::startEventsVector);
            int matchHeaders = offsetVector(fileBuilder, this.matchHeaders, GameWrapper::startMatchHeadersVector);
            int matchFooters = offsetVector(fileBuilder, this.matchFooters, GameWrapper::startMatchFootersVector);

            GameWrapper.startGameWrapper(fileBuilder);
            GameWrapper.addEvents(fileBuilder, events);
            GameWrapper.addMatchHeaders(fileBuilder, matchHeaders);
            GameWrapper.addMatchFooters(fileBuilder, matchFooters);

            fileBuilder.finish(GameWrapper.endGameWrapper(fileBuilder));

            byte[] rawBytes = fileBuilder.sizedByteArray();

            try {
                ByteArrayOutputStream result = new ByteArrayOutputStream();
                GZIPOutputStream zipper = new GZIPOutputStream(result);
                IOUtils.copy(new ByteArrayInputStream(rawBytes), zipper);
                zipper.close();
                zipper.flush();
                result.flush();
                finishedGame = result.toByteArray();
            } catch (IOException e) {
                throw new RuntimeException("Gzipping failed?", e);
            }
        }
        return finishedGame;
    }

    /**
     * Write a match out to a file.
     *
     * @param saveFile the file to save to
     */
    public void writeGame(File saveFile) {
        if(saveFile == null) {
            throw new RuntimeException("Null file provided to writeGame");
        }

        try {
            FileUtils.writeByteArrayToFile(saveFile, toBytes());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Run the same logic for both builders.
     *
     * @param perBuilder called with each builder; return event id. Should not mutate state.
     */
    private void createEvent(ToIntFunction<FlatBufferBuilder> perBuilder) {
        // make file event and add its offset to the list
        int eventAP = perBuilder.applyAsInt(fileBuilder);
        events.add(eventAP);

        if (packetSink != null) {
            // make packet event and package it up
            int eventBP = perBuilder.applyAsInt(packetBuilder);
            packetBuilder.finish(eventBP);
            packetSink.addEvent(packetBuilder.sizedByteArray());

            // reset packet builder
            packetBuilder = new FlatBufferBuilder(packetBuilder.dataBuffer());
        }
    }

    /**
     * Get the MatchMaker associated with this GameMaker.
     */
    public MatchMaker getMatchMaker() {
        return this.matchMaker;
    }

    public void makeGameHeader(){

        changeState(State.GAME_HEADER, State.IN_GAME);

        createEvent((builder) -> {
            int specVersionOffset = builder.createString(GameConstants.SPEC_VERSION);

            int name = builder.createString(gameInfo.getTeamAName());
            int packageName = builder.createString(gameInfo.getTeamAPackage());
            TeamData.startTeamData(builder);
            TeamData.addName(builder, name);
            TeamData.addPackageName(builder, packageName);
            TeamData.addTeamID(builder, TeamMapping.id(Team.A));
            int teamAOffset = TeamData.endTeamData(builder);

            name = builder.createString(gameInfo.getTeamBName());
            packageName = builder.createString(gameInfo.getTeamBPackage());
            TeamData.startTeamData(builder);
            TeamData.addName(builder, name);
            TeamData.addPackageName(builder, packageName);
            TeamData.addTeamID(builder, TeamMapping.id(Team.B));
            int teamBOffset = TeamData.endTeamData(builder);
            int[] teamsVec = {teamAOffset, teamBOffset};

            int teamsOffset = GameHeader.createTeamsVector(builder, teamsVec);
            int bodyTypeMetadataOffset = makeBodyTypeMetadata(builder);

            GameHeader.startGameHeader(builder);
            GameHeader.addSpecVersion(builder, specVersionOffset);
            GameHeader.addTeams(builder, teamsOffset);
            GameHeader.addBodyTypeMetadata(builder, bodyTypeMetadataOffset);
            int gameHeaderOffset = GameHeader.endGameHeader(builder);

            return EventWrapper.createEventWrapper(builder, Event.GameHeader, gameHeaderOffset);
        });
    }

    public int makeBodyTypeMetadata(FlatBufferBuilder builder){
        TIntArrayList bodyTypeMetadataOffsets = new TIntArrayList();

        // Add robot metadata
        for (RobotType type : RobotType.values()) {
            BodyTypeMetadata.startBodyTypeMetadata(builder);
            BodyTypeMetadata.addType(builder, robotTypeToBodyType(type));
            BodyTypeMetadata.addSpawnSource(builder, robotTypeToBodyType(type.spawnSource));
            BodyTypeMetadata.addCost(builder, type.cost);
            BodyTypeMetadata.addDirtLimit(builder, type.dirtLimit);
            BodyTypeMetadata.addSoupLimit(builder, type.soupLimit);
            BodyTypeMetadata.addActionCooldown(builder, type.actionCooldown);
            BodyTypeMetadata.addSensorRadiusSquared(builder, type.sensorRadiusSquared);
            BodyTypeMetadata.addPollutionRadiusSquared(builder, type.pollutionRadiusSquared);
            BodyTypeMetadata.addLocalPollutionAdditiveEffect(builder, type.localPollutionAdditiveEffect);
            BodyTypeMetadata.addLocalPollutionMultiplicativeEffect(builder, type.localPollutionMultiplicativeEffect);
            BodyTypeMetadata.addMaxSoupProduced(builder, type.maxSoupProduced);
            BodyTypeMetadata.addBytecodeLimit(builder, type.bytecodeLimit);
            bodyTypeMetadataOffsets.add(BodyTypeMetadata.endBodyTypeMetadata(builder));
        }

        // Make and return BodyTypeMetadata Vector offset
        return offsetVector(builder, bodyTypeMetadataOffsets, GameHeader::startBodyTypeMetadataVector);
    }

    private byte robotTypeToBodyType(RobotType type){
        if (type == RobotType.HQ) return BodyType.HQ;
        if (type == RobotType.MINER) return BodyType.MINER;
        if (type == RobotType.REFINERY) return BodyType.REFINERY;
        if (type == RobotType.VAPORATOR) return BodyType.VAPORATOR;
        if (type == RobotType.DESIGN_SCHOOL) return BodyType.DESIGN_SCHOOL;
        if (type == RobotType.FULFILLMENT_CENTER) return BodyType.FULFILLMENT_CENTER;
        if (type == RobotType.LANDSCAPER) return BodyType.LANDSCAPER;
        if (type == RobotType.DELIVERY_DRONE) return BodyType.DELIVERY_DRONE;
        if (type == RobotType.NET_GUN) return BodyType.NET_GUN;
        if (type == RobotType.COW) return BodyType.COW;
        return Byte.MIN_VALUE;
    }

    public void makeGameFooter(Team winner){
        changeState(State.IN_GAME, State.DONE);

        createEvent((builder) -> EventWrapper.createEventWrapper(builder, Event.GameFooter,
                GameFooter.createGameFooter(builder, TeamMapping.id(winner))));
    }

    /**
     * Writes events from match to one or multiple flatbuffers.
     *
     * One of the rare cases where we want a non-static inner class in Java:
     * this basically just provides a restricted interface to GameMaker.
     *
     * There is only one of these per GameMaker.
     */
    public class MatchMaker {
        private TIntArrayList movedIDs; // ints
        // VecTable for movedLocs in Round
        private TIntArrayList movedLocsXs;
        private TIntArrayList movedLocsYs;

        // SpawnedBodyTable for spawnedBodies
        private TIntArrayList spawnedBodiesRobotIDs;
        private TByteArrayList spawnedBodiesTeamIDs;
        private TByteArrayList spawnedBodiesTypes;
        private TIntArrayList spawnedBodiesLocsXs; //For locs
        private TIntArrayList spawnedBodiesLocsYs; //For locs

        private TIntArrayList diedIDs; // ints

        private TIntArrayList actionIDs; // ints
        private TByteArrayList actions; // Actions
        private TIntArrayList actionTargets; // ints (IDs)

        private TIntArrayList dirtChangedLocsXs; //For locs
        private TIntArrayList dirtChangedLocsYs; //For locs
        private TIntArrayList dirtChanges; // ints

        private TIntArrayList waterChangedLocsXs; //For locs
        private TIntArrayList waterChangedLocsYs; //For locs

        private int globalPollution;

        private TIntArrayList pollutionLocsXs; //For locs
        private TIntArrayList pollutionLocsYs; //For locs
        private TIntArrayList pollutionRadiiSquared;
        private TIntArrayList pollutionAdditiveEffects;
        private TFloatArrayList pollutionMultiplicativeEffects;

        private TIntArrayList soupChangedLocsXs; //For locs
        private TIntArrayList soupChangedLocsYs; //For locs
        private TIntArrayList soupChanges; // ints

        private TIntArrayList newMessagesCosts;
        private TCharArrayList newMessages;

        private TIntArrayList broadcastedMessagesCosts;
        private TCharArrayList broadcastedMessages;

        // Round statistics
        private TIntArrayList teamIDs;
        private TIntArrayList teamSoups;

        // Indicator dots with locations and RGB values
        private TIntArrayList indicatorDotIDs;
        private TIntArrayList indicatorDotLocsX;
        private TIntArrayList indicatorDotLocsY;
        private TIntArrayList indicatorDotRGBsRed;
        private TIntArrayList indicatorDotRGBsGreen;
        private TIntArrayList indicatorDotRGBsBlue;

        // Indicator lines with locations and RGB values
        private TIntArrayList indicatorLineIDs;
        private TIntArrayList indicatorLineStartLocsX;
        private TIntArrayList indicatorLineStartLocsY;
        private TIntArrayList indicatorLineEndLocsX;
        private TIntArrayList indicatorLineEndLocsY;
        private TIntArrayList indicatorLineRGBsRed;
        private TIntArrayList indicatorLineRGBsGreen;
        private TIntArrayList indicatorLineRGBsBlue;

        // Robot IDs and their bytecode usage
        private TIntArrayList bytecodeIDs;
        private TIntArrayList bytecodesUsed;

        // Used to write logs.
        private final ByteArrayOutputStream logger;

        public MatchMaker() {
            this.movedIDs = new TIntArrayList();
            this.movedLocsXs = new TIntArrayList();
            this.movedLocsYs = new TIntArrayList();
            this.spawnedBodiesRobotIDs = new TIntArrayList();
            this.spawnedBodiesTeamIDs = new TByteArrayList();
            this.spawnedBodiesTypes = new TByteArrayList();
            this.spawnedBodiesLocsXs = new TIntArrayList();
            this.spawnedBodiesLocsYs = new TIntArrayList();
            this.diedIDs = new TIntArrayList();
            this.actionIDs = new TIntArrayList();
            this.actions = new TByteArrayList();
            this.actionTargets = new TIntArrayList();
            this.dirtChangedLocsXs = new TIntArrayList();
            this.dirtChangedLocsYs = new TIntArrayList();
            this.dirtChanges = new TIntArrayList();
            this.waterChangedLocsXs = new TIntArrayList();
            this.waterChangedLocsYs = new TIntArrayList();
            this.globalPollution = 0;
            this.pollutionLocsXs = new TIntArrayList();
            this.pollutionLocsYs = new TIntArrayList();
            this.pollutionRadiiSquared = new TIntArrayList();
            this.pollutionAdditiveEffects = new TIntArrayList();
            this.pollutionMultiplicativeEffects = new TFloatArrayList();
            this.soupChangedLocsXs = new TIntArrayList();
            this.soupChangedLocsYs = new TIntArrayList();
            this.soupChanges = new TIntArrayList();
            this.newMessagesCosts = new TIntArrayList();
            this.newMessages = new TCharArrayList();
            this.broadcastedMessagesCosts = new TIntArrayList();
            this.broadcastedMessages = new TCharArrayList();
            this.teamIDs = new TIntArrayList();
            this.teamSoups = new TIntArrayList();
            this.indicatorDotIDs = new TIntArrayList();
            this.indicatorDotLocsX = new TIntArrayList();
            this.indicatorDotLocsY = new TIntArrayList();
            this.indicatorDotRGBsRed = new TIntArrayList();
            this.indicatorDotRGBsBlue = new TIntArrayList();
            this.indicatorDotRGBsGreen = new TIntArrayList();
            this.indicatorLineIDs = new TIntArrayList();
            this.indicatorLineStartLocsX = new TIntArrayList();
            this.indicatorLineStartLocsY = new TIntArrayList();
            this.indicatorLineEndLocsX = new TIntArrayList();
            this.indicatorLineEndLocsY = new TIntArrayList();
            this.indicatorLineRGBsRed = new TIntArrayList();
            this.indicatorLineRGBsBlue = new TIntArrayList();
            this.indicatorLineRGBsGreen = new TIntArrayList();
            this.bytecodeIDs = new TIntArrayList();
            this.bytecodesUsed = new TIntArrayList();
            this.logger = new ByteArrayOutputStream();
        }

        public void makeMatchHeader(LiveMap gameMap) {
            changeState(State.IN_GAME, State.IN_MATCH);

            createEvent((builder) -> {
                int map = GameMapIO.Serial.serialize(builder, gameMap);

                return EventWrapper.createEventWrapper(builder, Event.MatchHeader,
                        MatchHeader.createMatchHeader(builder, map, gameMap.getRounds()));
            });

            matchHeaders.add(events.size() - 1);

            clearData();
        }

        public void makeMatchFooter(Team winTeam, int totalRounds) {
            changeState(State.IN_MATCH, State.IN_GAME);

            createEvent((builder) -> EventWrapper.createEventWrapper(builder, Event.MatchFooter,
                    MatchFooter.createMatchFooter(builder, TeamMapping.id(winTeam), totalRounds)));

            matchFooters.add(events.size() - 1);
        }

        public void makeRound(int roundNum) {
            assertState(State.IN_MATCH);

            try {
                this.logger.flush();
            } catch (IOException e) {
                throw new RuntimeException("Can't flush byte[]outputstream?", e);
            }
            byte[] logs = this.logger.toByteArray();
            this.logger.reset();

            createEvent((builder) -> {
                // The bodies that spawned
                int spawnedBodiesLocsP = createVecTable(builder, spawnedBodiesLocsXs, spawnedBodiesLocsYs);
                int spawnedBodiesRobotIDsP = intVector(builder, spawnedBodiesRobotIDs, SpawnedBodyTable::startRobotIDsVector);
                int spawnedBodiesTeamIDsP = byteVector(builder, spawnedBodiesTeamIDs, SpawnedBodyTable::startTeamIDsVector);
                int spawnedBodiesTypesP = byteVector(builder, spawnedBodiesTypes, SpawnedBodyTable::startTypesVector);
                SpawnedBodyTable.startSpawnedBodyTable(builder);
                SpawnedBodyTable.addLocs(builder, spawnedBodiesLocsP);
                SpawnedBodyTable.addRobotIDs(builder, spawnedBodiesRobotIDsP);
                SpawnedBodyTable.addTeamIDs(builder, spawnedBodiesTeamIDsP);
                SpawnedBodyTable.addTypes(builder, spawnedBodiesTypesP);
                int spawnedBodiesP = SpawnedBodyTable.endSpawnedBodyTable(builder);

                // Round statistics
                int teamIDsP = intVector(builder, teamIDs, Round::startTeamIDsVector);
                int teamSoupsP = intVector(builder, teamSoups, Round::startTeamSoupsVector);

                // The bodies that moved
                int movedIDsP = intVector(builder, movedIDs, Round::startMovedIDsVector);
                int movedLocsP = createVecTable(builder, movedLocsXs, movedLocsYs);

                // The bodies that died
                int diedIDsP = intVector(builder, diedIDs, Round::startDiedIDsVector);

                // The actions that happened
                int actionIDsP = intVector(builder, actionIDs, Round::startActionIDsVector);
                int actionsP = byteVector(builder, actions, Round::startActionsVector);
                int actionTargetsP = intVector(builder, actionTargets, Round::startActionTargetsVector);

                // The dirt changes on locations
                int dirtChangedLocsP = createVecTable(builder, dirtChangedLocsXs, dirtChangedLocsYs);
                int dirtChangesP = intVector(builder, dirtChanges, Round::startDirtChangesVector);

                // The water changes on locations
                int waterChangedLocsP = createVecTable(builder, waterChangedLocsXs, waterChangedLocsYs);

                // The local pollution
                int pollutionLocationsP = createVecTable(builder, pollutionLocsXs, pollutionLocsYs);
                int pollutionRadiiSquaredP = intVector(builder, pollutionRadiiSquared, LocalPollutionTable::startRadiiSquaredVector);
                int pollutionAdditiveEffectsP = intVector(builder, pollutionAdditiveEffects, LocalPollutionTable::startAdditiveEffectsVector);
                int pollutionMultiplicativeEffectsP = floatVector(builder, pollutionMultiplicativeEffects, LocalPollutionTable::startMultiplicativeEffectsVector);
                LocalPollutionTable.startLocalPollutionTable(builder);
                LocalPollutionTable.addLocations(builder, pollutionLocationsP);
                LocalPollutionTable.addRadiiSquared(builder, pollutionRadiiSquaredP);
                LocalPollutionTable.addAdditiveEffects(builder, pollutionAdditiveEffectsP);
                LocalPollutionTable.addMultiplicativeEffects(builder, pollutionMultiplicativeEffectsP);
                int localPollutionsP = LocalPollutionTable.endLocalPollutionTable(builder);

                // The soup changes on locations
                int soupChangedLocsP = createVecTable(builder, soupChangedLocsXs, soupChangedLocsYs);
                int soupChangesP = intVector(builder, soupChanges, Round::startSoupChangesVector);

                // New message requests
                int newMessagesCostsP = intVector(builder, newMessagesCosts, Round::startNewMessagesCostsVector);
                int newMessagesP = charVector(builder, newMessages, Round::startNewMessagesVector);
                
                // Broadcasted messages
                int broadcastedMessagesCostsP = intVector(builder, broadcastedMessagesCosts, Round::startBroadcastedMessagesCostsVector);
                int broadcastedMessagesP = charVector(builder, broadcastedMessages, Round::startBroadcastedMessagesVector);

                // The indicator dots that were set
                int indicatorDotIDsP = intVector(builder, indicatorDotIDs, Round::startIndicatorDotIDsVector);
                int indicatorDotLocsP = createVecTable(builder, indicatorDotLocsX, indicatorDotLocsY);
                int indicatorDotRGBsP = createRGBTable(builder, indicatorDotRGBsRed, indicatorDotRGBsGreen, indicatorDotRGBsBlue);

                // The indicator lines that were set
                int indicatorLineIDsP = intVector(builder, indicatorLineIDs, Round::startIndicatorLineIDsVector);
                int indicatorLineStartLocsP = createVecTable(builder, indicatorLineStartLocsX, indicatorLineStartLocsY);
                int indicatorLineEndLocsP = createVecTable(builder, indicatorLineEndLocsX, indicatorLineEndLocsY);
                int indicatorLineRGBsP = createRGBTable(builder, indicatorLineRGBsRed, indicatorLineRGBsGreen, indicatorLineRGBsBlue);

                // The bytecode usage
                int bytecodeIDsP = intVector(builder, bytecodeIDs, Round::startBytecodeIDsVector);
                int bytecodesUsedP = intVector(builder, bytecodesUsed, Round::startBytecodesUsedVector);

                int logsP = builder.createString(ByteBuffer.wrap(logs));

                Round.startRound(builder);
                Round.addTeamIDs(builder, teamIDsP);
                Round.addTeamSoups(builder, teamSoupsP);
                Round.addMovedIDs(builder, movedIDsP);
                Round.addMovedLocs(builder, movedLocsP);
                Round.addSpawnedBodies(builder, spawnedBodiesP);
                Round.addDiedIDs(builder, diedIDsP);
                Round.addActionIDs(builder, actionIDsP);
                Round.addActions(builder, actionsP);
                Round.addActionTargets(builder, actionTargetsP);
                Round.addDirtChangedLocs(builder, dirtChangedLocsP);
                Round.addDirtChanges(builder, dirtChangesP);
                Round.addWaterChangedLocs(builder, waterChangedLocsP);
                Round.addGlobalPollution(builder, globalPollution);
                Round.addLocalPollutions(builder, localPollutionsP);
                Round.addSoupChangedLocs(builder, soupChangedLocsP);
                Round.addSoupChanges(builder, soupChangesP);
                Round.addNewMessagesCosts(builder, newMessagesCostsP);
                Round.addNewMessages(builder, newMessagesP);
                Round.addBroadcastedMessagesCosts(builder, broadcastedMessagesCostsP);
                Round.addBroadcastedMessages(builder, broadcastedMessagesP);
                Round.addIndicatorDotIDs(builder, indicatorDotIDsP);
                Round.addIndicatorDotLocs(builder, indicatorDotLocsP);
                Round.addIndicatorDotRGBs(builder, indicatorDotRGBsP);
                Round.addIndicatorLineIDs(builder, indicatorLineIDsP);
                Round.addIndicatorLineStartLocs(builder, indicatorLineStartLocsP);
                Round.addIndicatorLineEndLocs(builder, indicatorLineEndLocsP);
                Round.addIndicatorLineRGBs(builder, indicatorLineRGBsP);
                Round.addRoundID(builder, roundNum);
                Round.addBytecodeIDs(builder, bytecodeIDsP);
                Round.addBytecodesUsed(builder, bytecodesUsedP);
                Round.addLogs(builder, logsP);
                int round = Round.endRound(builder);
                return EventWrapper.createEventWrapper(builder, Event.Round, round);
            });

            clearData();
        }

        /**
         * @return an outputstream that will be baked into the output file
         */
        public OutputStream getOut() {
            return logger;
        }

        public void addMoved(int id, MapLocation newLocation) {
            movedIDs.add(id);
            movedLocsXs.add(newLocation.x);
            movedLocsYs.add(newLocation.y);
        }

        public void addDied(int id) {
            diedIDs.add(id);
        }

        public void addAction(int userID, byte action, int targetID) {
            actionIDs.add(userID);
            actions.add(action);
            actionTargets.add(targetID);
        }

        public void addDirtChanged(MapLocation loc, int change) {
            dirtChangedLocsXs.add(loc.x);
            dirtChangedLocsYs.add(loc.y);
            dirtChanges.add(change);
        }

        public void addWaterChanged(MapLocation loc) {
            waterChangedLocsXs.add(loc.x);
            waterChangedLocsYs.add(loc.y);
        }

        public void setGlobalPollution(int globalPollution) {
            this.globalPollution = globalPollution;
        }

        public void addLocalPollution(MapLocation loc, int radiusSquared, int additive, float multiplicative) {
            pollutionLocsXs.add(loc.x);
            pollutionLocsYs.add(loc.y);
            pollutionRadiiSquared.add(radiusSquared);
            pollutionAdditiveEffects.add(additive);
            pollutionMultiplicativeEffects.add(multiplicative);
        }

        public void addSoupChanged(MapLocation loc, int change) {
            soupChangedLocsXs.add(loc.x);
            soupChangedLocsYs.add(loc.y);
            soupChanges.add(change);
        }

        public void addNewMessage(int cost, String message) {
            newMessagesCosts.add(cost);
            for (char c : message.toCharArray())
                newMessages.add(c);
            newMessages.add(' ');
        }

        public void addBroadcastedMessage(int cost, String message) {
            broadcastedMessagesCosts.add(cost);
            for (char c : message.toCharArray())
                broadcastedMessages.add(c);
            broadcastedMessages.add(' ');
        }

        public void addTeamSoup(Team team, int soup) {
            teamIDs.add(TeamMapping.id(team));
            teamSoups.add(soup);
        }

        public void addIndicatorDot(int id, MapLocation loc, int red, int green, int blue) {
            indicatorDotIDs.add(id);
            indicatorDotLocsX.add(loc.x);
            indicatorDotLocsY.add(loc.y);
            indicatorDotRGBsRed.add(red);
            indicatorDotRGBsGreen.add(green);
            indicatorDotRGBsBlue.add(blue);
        }

        public void addIndicatorLine(int id, MapLocation startLoc, MapLocation endLoc, int red, int green, int blue) {
            indicatorLineIDs.add(id);
            indicatorLineStartLocsX.add(startLoc.x);
            indicatorLineStartLocsY.add(startLoc.y);
            indicatorLineEndLocsX.add(endLoc.x);
            indicatorLineEndLocsY.add(endLoc.y);
            indicatorLineRGBsRed.add(red);
            indicatorLineRGBsGreen.add(green);
            indicatorLineRGBsBlue.add(blue);
        }

        public void addBytecodes(int id, int bytecodes) {
            bytecodeIDs.add(id);
            bytecodesUsed.add(bytecodes);
        }

        public void addSpawnedRobot(InternalRobot robot) {
            spawnedBodiesRobotIDs.add(robot.getID());
            spawnedBodiesLocsXs.add(robot.getLocation().x);
            spawnedBodiesLocsYs.add(robot.getLocation().y);
            spawnedBodiesTeamIDs.add(TeamMapping.id(robot.getTeam()));
            spawnedBodiesTypes.add(FlatHelpers.getBodyTypeFromRobotType(robot.getType()));
        }

        private void clearData() {
            movedIDs.clear();
            movedLocsXs.clear();
            movedLocsYs.clear();
            spawnedBodiesRobotIDs.clear();
            spawnedBodiesTeamIDs.clear();
            spawnedBodiesTypes.clear();
            spawnedBodiesLocsXs.clear();
            spawnedBodiesLocsYs.clear();
            diedIDs.clear();
            actionIDs.clear();
            actions.clear();
            actionTargets.clear();
            dirtChangedLocsXs.clear();
            dirtChangedLocsYs.clear();
            dirtChanges.clear();
            waterChangedLocsXs.clear();
            waterChangedLocsYs.clear();
            globalPollution = 0;
            pollutionLocsXs.clear();
            pollutionLocsYs.clear();
            pollutionRadiiSquared.clear();
            pollutionAdditiveEffects.clear();
            pollutionMultiplicativeEffects.clear();
            soupChangedLocsXs.clear();
            soupChangedLocsYs.clear();
            soupChanges.clear();
            newMessagesCosts.clear();
            newMessages.clear();
            broadcastedMessagesCosts.clear();
            broadcastedMessages.clear();
            teamIDs.clear();
            teamSoups.clear();
            indicatorDotIDs.clear();
            indicatorDotLocsX.clear();
            indicatorDotLocsY.clear();
            indicatorDotRGBsRed.clear();
            indicatorDotRGBsBlue.clear();
            indicatorDotRGBsGreen.clear();
            indicatorLineIDs.clear();
            indicatorLineStartLocsX.clear();
            indicatorLineStartLocsY.clear();
            indicatorLineEndLocsX.clear();
            indicatorLineEndLocsY.clear();
            indicatorLineRGBsRed.clear();
            indicatorLineRGBsBlue.clear();
            indicatorLineRGBsGreen.clear();
            bytecodeIDs.clear();
            bytecodesUsed.clear();
        }
    }
}
