package battlecode.server;

import battlecode.common.GameConstants;
import battlecode.common.Team;
import battlecode.world.*;
import battlecode.world.control.*;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

/**
 * Runs matches. Specifically, this class forms a pipeline connecting match and
 * configuration parameters to the game engine and engine output to an abstract
 * match data sink.
 */
public strictfp class Server implements Runnable {
    /**
     * The GameInfo that signals the server to terminate when it is encountered on the game queue.
     */
    private static final GameInfo POISON = new GameInfo(null, null, null, null, null, null, null, null, false) {};

    /**
     * The queue of games to run.
     * When the server encounters the GameInfo POISON, it terminates.
     */
    private final BlockingQueue<GameInfo> gameQueue;

    /**
     * The state of the match that the server is running (or about to run).
     */
    private ServerState state;

    /**
     * The options provided to the server via config file and command line.
     */
    private final Config options;

    /**
     * Whether to wait for notifications to control match run state, or to just
     * run all matches immediately.
     */
    private final boolean interactive;

    /**
     * The GameWorld the server is currently operating on.
     */
    private GameWorld currentWorld;


    /**
     * The server's mode affects how notifications are handled, whether or not
     * an RPC server is set up, and which controllers are chosen for server
     * operation.
     */
    public enum Mode {
        HEADLESS,
    }

    /**
     * Initializes a new server.
     *
     * @param options the configuration to use
     * @param interactive whether to wait for notifications to control the
     *                    match run state
     */
    public Server(Config options, boolean interactive) {
        this.gameQueue = new LinkedBlockingQueue<>();

        this.interactive = interactive;

        this.options = options;
        this.state = ServerState.NOT_READY;
    }

    // ******************************
    // ***** NOTIFICATIONS **********
    // ******************************

    public void startNotification(){
        state = ServerState.READY;
    }

    public void pauseNotification(){
        state = ServerState.PAUSED;
    }

    public void resumeNotification(){
        if (state == ServerState.PAUSED){
            state = ServerState.RUNNING;
        }
    }

    public void runNotification(){
        if (state != ServerState.PAUSED) {
            state = ServerState.RUNNING;
        }
    }

    public void addGameNotification(GameInfo gameInfo){
        this.gameQueue.add(gameInfo);
    }

    public void terminateNotification(){
        this.gameQueue.add(POISON);
    }

    // ******************************
    // ***** SIMULATION METHODS *****
    // ******************************

    /**
     * Runs the server. The server will wait for some game info (which
     * specifies the teams and set of maps to run) and then begin running
     * matches.
     */
    public void run() {
        final NetServer netServer;
        if (options.getBoolean("bc.server.websocket")) {
            netServer = new NetServer(options.getInt("bc.server.port"),
                                      options.getBoolean("bc.server.wait-for-client"));
            netServer.start();
        } else {
            netServer = null;
        }

        while (true) {
            final GameInfo currentGame;
            debug("Awaiting match");
            try {
                currentGame = gameQueue.take();
            } catch (InterruptedException e) {
                warn("Interrupted while waiting for next game!");
                e.printStackTrace();
                Thread.currentThread().interrupt();
                return;
            }

            // Note: ==, not .equals()
            if (currentGame == POISON) {
                debug("Shutting down server");
                if (netServer != null) {
                    netServer.finish();
                }
                return;
            }

            GameMaker gameMaker = new GameMaker(currentGame, netServer);
            gameMaker.makeGameHeader();

            debug("Running: "+currentGame);

            // Set up our control provider
            final RobotControlProvider prov = createControlProvider(currentGame, gameMaker);

            // Count wins
            int aWins = 0, bWins = 0;

            // Loop through the maps in the current game
            for (int matchIndex = 0; matchIndex < currentGame.getMaps().length; matchIndex++) {

                Team winner;
                try {
                    winner = runMatch(currentGame, matchIndex, prov, gameMaker);
                } catch (Exception e) {
                    ErrorReporter.report(e);
                    this.state = ServerState.ERROR;
                    return;
                }

                switch (winner) {
                    case A:
                        aWins++;
                        break;
                    case B:
                        bWins++;
                        break;
                    default:
                        warn("Team "+winner+" won???");
                }

                currentWorld = null;

                if (currentGame.isBestOfThree()) {
                    if (aWins == 2 || bWins == 2) {
                        break;
                    }
                }
            }
            Team winner = aWins >= bWins ? Team.A : Team.B;
            gameMaker.makeGameFooter(winner);
            gameMaker.writeGame(currentGame.getSaveFile());
        }
    }


    /**
     * @return the winner of the match
     * @throws Exception if the match fails to run for some reason
     */
    private Team runMatch(GameInfo currentGame,
                          int matchIndex,
                          RobotControlProvider prov,
                          GameMaker gameMaker) throws Exception {

        final String mapName = currentGame.getMaps()[matchIndex];
        final LiveMap loadedMap;

        try {
            loadedMap = GameMapIO.loadMap(mapName, new File(options.get("bc.game.map-path")));
            debug("running map " + loadedMap);
        } catch (IOException e) {
            warn("Couldn't load map " + mapName + ", skipping");
            throw e;
        }

        // Create the game world!
        currentWorld = new GameWorld(loadedMap, prov, gameMaker.getMatchMaker());

        // Get started
        if (interactive) {
            // TODO necessary?
            // Poll for RUNNING, if we're in interactive mode
            while (!ServerState.RUNNING.equals(state)) {
                try {
                    Thread.sleep(250);
                } catch (InterruptedException e) {}
            }
        } else {
            // Start the game immediately if we're not in interactive mode
            this.state = ServerState.RUNNING;
        }

        long startTime = System.currentTimeMillis();
        say("-------------------- Match Starting --------------------");
        say(String.format("%s vs. %s on %s", currentGame.getTeamAPackage(), currentGame.getTeamBPackage(), mapName));

        // If there are more rounds to be run, run them and
        // and send the round (and optionally stats) bytes to
        // recipients.
        while (this.state != ServerState.FINISHED) {

            // If not paused/stopped:
            switch (this.state) {

                case RUNNING:
                    GameState state = currentWorld.runRound();

                    if (GameState.DONE.equals(state)) {
                        this.state = ServerState.FINISHED;
                        break;
                    }

                    break;

                case PAUSED:
                    Thread.sleep(250);
                    break;
            }
        }

        say(getWinnerString(currentGame, currentWorld.getWinner(), currentWorld.getCurrentRound()));
        say("-------------------- Match Finished --------------------");

        double timeDiff = (System.currentTimeMillis() - startTime) / 1000.0;
        debug(String.format("match completed in %.4g seconds", timeDiff));
        return currentWorld.getWinner();
    }

    // ******************************
    // ***** CREATOR METHODS ********
    // ******************************

    /**
     * Create a RobotControlProvider for a game.
     *
     * @param game the game to provide control for
     * @return a fresh control provider for the game
     */
    private RobotControlProvider createControlProvider(GameInfo game, GameMaker gameMaker) {
        // Strictly speaking, this should probably be somewhere in battlecode.world
        // Whatever

        final TeamControlProvider teamProvider = new TeamControlProvider();

        teamProvider.registerControlProvider(
                Team.A,
                new PlayerControlProvider(game.getTeamAPackage(), game.getTeamAURL(), gameMaker.getMatchMaker().getOut())
        );
        teamProvider.registerControlProvider(
                Team.B,
                new PlayerControlProvider(game.getTeamBPackage(), game.getTeamBURL(), gameMaker.getMatchMaker().getOut())
        );
        teamProvider.registerControlProvider(
                Team.NEUTRAL,
                new CowControlProvider()
        );
        return teamProvider;
    }

    // ******************************
    // ***** GETTER METHODS *********
    // ******************************

    /**
     * @return the state of the game
     */
    public ServerState getState() {
        return this.state;
    }

    /**
     * Produces a string for the winner of the match.
     *
     * @return A string representing the match's winner.
     */
    public String getWinnerString(GameInfo game, Team winner, int roundNumber) {

        String teamName;

        switch (winner) {
            case A:
                teamName = game.getTeamAPackage() + " (A)";
                break;

            case B:
                teamName = game.getTeamBPackage() + " (B)";
                break;

            default:
                teamName = "nobody";
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < (50 - teamName.length()) / 2; i++)
            sb.append(' ');
        sb.append(teamName);
        sb.append(" wins (round ").append(roundNumber).append(")");

        sb.append("\nReason: ");
        GameStats stats = currentWorld.getGameStats();
        DominationFactor dom = stats.getDominationFactor();

        switch (dom) {
            case HQ_DESTROYED:
                sb.append("The winning team won by enemy HQ being destroyed.");
                break;
            case QUANTITY_OVER_QUALITY:
                sb.append("The winning team won on tiebreakers (more robots).");
                break;
            case QUALITY_OVER_QUANTITY:
                sb.append("The winning team won on tiebreakers (higher net worth: soup + soup cost of robots).");
                break;
            case GOSSIP_GIRL:
                sb.append("The winning team won on tiebreakers (more successful broadcasts).");
                break;
            case HIGHBORN:
                sb.append("The winning team won arbitrarily (highest robot ID).");
                break;
            case WON_BY_DUBIOUS_REASONS:
                sb.append("The winning team won arbitrarily (coin flip).");
                break;
        }

        return sb.toString();
    }

    /**
     * @return whether we are actively running a match
     */
    public boolean isRunningMatch() {
        return currentWorld != null && currentWorld.isRunning();
    }


    // ******************************
    // ***** CONSOLE MESSAGES *******
    // ******************************


    /**
     * This method is used to display warning messages with formatted output.
     *
     * @param msg the warning message to display
     */
    public static void warn(String msg) {
        for (String line : msg.split("\n")) {
            System.out.printf("[server:warning] %s\n", line);
        }
    }

    /**
     * This method is used to display "official" formatted messages from the
     * server.
     *
     * @param msg the message to display
     */
    public static void say(String msg) {
        for (String line : msg.split("\n")) {
            System.out.printf("[server] %s\n", line);
        }
    }

    /**
     * This method is used to display debugging messages with formatted output.
     *
     * @param msg the debug message to display
     */
    public static void debug(String msg) {
        if (Config.getGlobalConfig().getBoolean("bc.server.debug")) {
            for (String line : msg.split("\n")) {
                System.out.printf("[server:debug] %s\n", line);
            }
        }
    }
}
