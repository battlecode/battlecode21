package battlecode.world.control;

import battlecode.common.Team;
import battlecode.world.GameWorld;
import battlecode.world.InternalRobot;

import java.util.*;

/**
 * Delegates to other robot control providers based on the teams of given
 * robots.
 *
 * @author james
 */
public final class TeamControlProvider implements RobotControlProvider {
    /**
     * The map of teams to providers.
     */
    private final Map<Team, RobotControlProvider> teamProviderMap;

    /**
     * The list of providers, redundant with teamProviderMap in order
     * to ensure that the providers are iterated in a deterministic
     * order.
     */
    private final List<RobotControlProvider> orderedProviders;

    public TeamControlProvider() {
        teamProviderMap = new EnumMap<>(Team.class);
        orderedProviders = new ArrayList<>();
    }

    /**
     * Register a control provider for a team.
     *
     * @param team the team to register the provider for
     * @param provider the provider to register
     */
    public void registerControlProvider(final Team team, final RobotControlProvider provider) {
        if (teamProviderMap.containsKey(team)) {
            throw new IllegalArgumentException("Team " + team + " already has a control provider.");
        }

        teamProviderMap.put(team, provider);

        if (!orderedProviders.contains(provider)) {
            orderedProviders.add(provider);
        }
    }

    @Override
    public void matchStarted(GameWorld world) {
        for (RobotControlProvider provider : orderedProviders) {
            provider.matchStarted(world);
        }
    }

    @Override
    public void matchEnded() {
        for (RobotControlProvider provider : orderedProviders) {
            provider.matchEnded();
        }
    }

    @Override
    public void robotSpawned(InternalRobot robot) {
        Team team = robot.getTeam();
        assert teamProviderMap.containsKey(team);

        teamProviderMap.get(team).robotSpawned(robot);
    }

    @Override
    public void robotKilled(InternalRobot robot) {
        Team team = robot.getTeam();
        assert teamProviderMap.containsKey(team);

        teamProviderMap.get(team).robotKilled(robot);
    }

    @Override
    public void roundStarted() {
        for (RobotControlProvider provider : orderedProviders) {
            provider.roundStarted();
        }
    }

    @Override
    public void roundEnded() {
        for (RobotControlProvider provider : orderedProviders) {
            provider.roundEnded();
        }
    }

    @Override
    public void runRobot(InternalRobot robot) {
        Team team = robot.getTeam();
        assert teamProviderMap.containsKey(team);

        teamProviderMap.get(team).runRobot(robot);

    }

    @Override
    public int getBytecodesUsed(InternalRobot robot) {
        Team team = robot.getTeam();
        assert teamProviderMap.containsKey(team);

        return teamProviderMap.get(team).getBytecodesUsed(robot);
    }

    @Override
    public boolean getTerminated(InternalRobot robot) {
        Team team = robot.getTeam();
        assert teamProviderMap.containsKey(team);

        return teamProviderMap.get(team).getTerminated(robot);
    }
}
