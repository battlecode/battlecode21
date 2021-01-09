package battlecode.world.control;

import battlecode.common.Team;
import battlecode.instrumenter.InstrumentationException;
import battlecode.instrumenter.TeamClassLoaderFactory;
import battlecode.instrumenter.SandboxedRobotPlayer;
import battlecode.instrumenter.profiler.Profiler;
import battlecode.instrumenter.profiler.ProfilerCollection;
import battlecode.server.ErrorReporter;
import battlecode.world.GameWorld;
import battlecode.world.InternalRobot;

import java.io.OutputStream;
import java.io.PrintStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Controls robots with instrumented player code.
 * The point of contact between GameWorld and the instrumenter/scheduler
 * infrastructure.
 *
 * @author james
 */
public class PlayerControlProvider implements RobotControlProvider {

    /**
     * Used to create ClassLoaders for this team.
     */
    private final TeamClassLoaderFactory factory;

    /**
     * The sandboxed robot players we're using to control robots;
     * maps ids to sandboxes.
     *
     * When a sandbox has been terminated, its entry in the map
     * will have a value of null, so that the classloader it uses
     * can be reclaimed.
     */
    private final Map<Integer, SandboxedRobotPlayer> sandboxes;

    /**
     * The GameWorld we're providing for.
     */
    private GameWorld gameWorld;

    /**
     * The name of the team (package) we're processing.
     */
    private final String teamPackage;

    /**
     * The printstream robots should write to (besides System.out).
     */
    private final OutputStream robotOut;

    /**
     * The team this control provider controls.
     */
    private final Team team;

    /**
     * The ProfilerCollection instance holding the profilers for the team.
     * Null if profiling is disabled.
     */
    private ProfilerCollection profilerCollection;

    /**
     * The match id of the current match. Incremented by one every time a new match starts.
     */
    private int matchId = -1;

    /**
     * Create a new PlayerControlProvider.
     *
     * @param team             the team we're loading
     * @param teamPackage      the name / package of the team we're loading
     * @param teamURL          the url of the classes for the team;
     * @param robotOut         the output that robots should write to
     * @param profilingEnabled whether profiling is enabled or not
     */
    public PlayerControlProvider(Team team,
                                 String teamPackage,
                                 String teamURL,
                                 OutputStream robotOut,
                                 boolean profilingEnabled) {
        this.teamPackage = teamPackage;
        this.sandboxes = new HashMap<>(); // GameWorld maintains order for us
        this.factory = new TeamClassLoaderFactory(teamURL);
        this.robotOut = robotOut;
        this.team = team;

        if (profilingEnabled) {
            profilerCollection = new ProfilerCollection();
        }
    }

    @Override
    public void matchStarted(GameWorld gameWorld) {
        this.gameWorld = gameWorld;
        matchId++;
    }

    @Override
    public void matchEnded() {
        if (profilerCollection != null) {
            gameWorld.setProfilerCollection(team, profilerCollection);
            profilerCollection = new ProfilerCollection();
        }

        for (final SandboxedRobotPlayer player : this.sandboxes.values()) {
           if (player != null && !player.getTerminated()) {
               player.terminate();
           }
        }

        this.sandboxes.clear();
        this.gameWorld = null;
    }

    @Override
    public void robotSpawned(InternalRobot robot) {
        try {
            Profiler profiler = null;
            if (profilerCollection != null && robot.getTeam() == team) {
                profiler = profilerCollection.createProfiler(robot.getID(), robot.getType());
            }

            final SandboxedRobotPlayer player = new SandboxedRobotPlayer(
                    teamPackage,
                    robot.getController(),
                    robot.getID(),
                    factory.createLoader(profiler != null),
                    robotOut,
                    profiler
            );
            this.sandboxes.put(robot.getID(), player);
        } catch (InstrumentationException e) {
            ErrorReporter.report("Error while loading player "+ teamPackage +": "+e.getMessage(), false);
            robot.die_exception();
        } catch (RuntimeException e) {
            ErrorReporter.report(e, true);
            robot.die_exception();
        }

    }

    @Override
    public void robotKilled(InternalRobot robot) {
        // Note that a robot may be killed even if it is not in Sandboxes, if
        // there was an error while loading it.

        final SandboxedRobotPlayer player = this.sandboxes.get(robot.getID());

        if (player != null) {
            this.sandboxes.get(robot.getID()).terminate();
        }

        this.sandboxes.put(robot.getID(), null);
    }

    @Override
    public void roundStarted() {}

    @Override
    public void roundEnded() {}

    @Override
    public void runRobot(InternalRobot robot) {
        assert this.sandboxes.get(robot.getID()) != null;

        final SandboxedRobotPlayer player = this.sandboxes.get(robot.getID());

        if (player != null) {
            player.setBytecodeLimit(robot.getBytecodeLimit());
            player.step();
        }
    }

    @Override
    public int getBytecodesUsed(InternalRobot robot) {
        assert this.sandboxes.containsKey(robot.getID());

        final SandboxedRobotPlayer player = this.sandboxes.get(robot.getID());

        if (player != null) {
            return player.getBytecodesUsed();
        } else {
            return 0;
        }
    }

    @Override
    public boolean getTerminated(InternalRobot robot) {
        assert this.sandboxes.containsKey(robot.getID());

        final SandboxedRobotPlayer player = this.sandboxes.get(robot.getID());

        if (player != null) {
            return player.getTerminated();
        } else {
            return true;
        }
    }
}
