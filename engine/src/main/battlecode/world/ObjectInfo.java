package battlecode.world;

import battlecode.common.GameConstants;
import battlecode.common.MapLocation;
import battlecode.common.RobotType;
import battlecode.common.Team;

import gnu.trove.list.array.TIntArrayList;
import gnu.trove.map.hash.TIntObjectHashMap;
import gnu.trove.procedure.TIntObjectProcedure;
import gnu.trove.procedure.TIntProcedure;

import gnu.trove.procedure.TObjectProcedure;
import net.sf.jsi.SpatialIndex;
import net.sf.jsi.rtree.RTree;
import net.sf.jsi.Rectangle;
import net.sf.jsi.Point;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.Map;


/**
 * This class is used to hold information about the robots
 * in the game world.
 */
public strictfp class ObjectInfo {
    private final int mapWidth;
    private final int mapHeight;
    private final MapLocation mapTopLeft;

    private final TIntObjectHashMap<InternalRobot> gameRobotsByID;

    private final SpatialIndex robotIndex;

    private final TIntArrayList dynamicBodyExecOrder;

    private Map<Team, Map<RobotType, Integer>> robotTypeCount = new EnumMap<>(
            Team.class);
    private int[] robotCount = new int[3];

    public ObjectInfo(LiveMap gm){
        this.mapWidth = gm.getWidth();
        this.mapHeight = gm.getHeight();
        this.mapTopLeft = gm.getOrigin();

        this.gameRobotsByID = new TIntObjectHashMap<>();

        robotIndex = new RTree();

        dynamicBodyExecOrder = new TIntArrayList();

        robotIndex.init(null);

        robotTypeCount.put(Team.A, new EnumMap<>(
                RobotType.class));
        robotTypeCount.put(Team.B, new EnumMap<>(
                RobotType.class));
        robotTypeCount.put(Team.NEUTRAL, new EnumMap<>(
                RobotType.class));
    }

    public int getRobotTypeCount(Team team, RobotType type) {
        if (robotTypeCount.get(team).containsKey(type)) {
            return robotTypeCount.get(team).get(type);
        } else {
            return 0;
        }
    }

    /**
     * Apply an operation for every robot, ordered based on robot ID hash (effectively random).
     * Return false to stop iterating.
     * If you call destroyRobot() on a robot that hasn't been seen yet,
     * that robot will be silently skipped.
     *
     * @param op a lambda (currency) -> void
     */
    public void eachRobot(TObjectProcedure<InternalRobot> op) {
        gameRobotsByID.forEachValue(op);
        //eachRobotBySpawnOrder(op);
    }

    /**
     * Apply an operation for every Robot, in the order the
     * bodies should be updated. Robots update in spawn order.
     * Return false to stop iterating.
     *
     * If a body is removed during iteration, the body is cleanly skipped.
     *
     * @param op a lambda (body) -> void
     */
    public void eachDynamicBodyByExecOrder(TObjectProcedure<InternalRobot> op) {
        // We can't modify the ArrayList we are looping over
        int[] spawnOrderArray = dynamicBodyExecOrder.toArray();

        for (int id : spawnOrderArray) {
            // Check if body still exists.
            if (existsRobot(id)) {
                boolean returnedTrue = op.execute(gameRobotsByID.get(id));
                if (!returnedTrue)
                    break;
            } else {
                // The body does not exist, so it was deleted in an earlier
                // iteration and should be skipped.
                continue;
            }
        }
    }

    /**
     * This allocates; prefer eachRobot()
     */
    public Collection<InternalRobot> robots() {
        return gameRobotsByID.valueCollection();
    }

    /**
     * This allocates; prefer eachRobot()
     */
    public InternalRobot[] robotsArray() {
        return gameRobotsByID.values(new InternalRobot[gameRobotsByID.size()]);
    }

    public int getRobotCount(Team team) {
        return robotCount[team.ordinal()];
    }

    public InternalRobot getRobotByID(int id) {
        return gameRobotsByID.get(id);
    }

    public void moveRobot(InternalRobot robot, MapLocation newLocation) {
        MapLocation loc = robot.getLocation();

        robotIndex.delete(fromPoint(loc),robot.getID());
        robotIndex.add(fromPoint(newLocation),robot.getID());
    }

    // ****************************
    // *** ADDING OBJECTS *********
    // ****************************

    public void spawnRobot(InternalRobot robot){
        incrementRobotCount(robot.getTeam());
        incrementRobotTypeCount(robot.getTeam(), robot.getType());

        int id = robot.getID();
        gameRobotsByID.put(id, robot);

        dynamicBodyExecOrder.add(id);

        MapLocation loc = robot.getLocation();
        robotIndex.add(fromPoint(loc),robot.getID());
    }

    // ****************************
    // *** EXISTS CHECKS **********
    // ****************************

    public boolean existsRobot(int id){
        return gameRobotsByID.containsKey(id);
    }

    // ****************************
    // *** DESTROYING OBJECTS *****
    // ****************************

    public void destroyRobot(int id){
        InternalRobot robot = getRobotByID(id);

        // drop a unit if one is currently held
        if (robot.getType() == RobotType.DELIVERY_DRONE && robot.isCurrentlyHoldingUnit()) {
            int pickedUpUnitid = robot.getIdOfUnitCurrentlyHeld();
            InternalRobot pickedUpUnit = getRobotByID(id);
            pickedUpUnit.unblockUnit();
        }

        decrementRobotCount(robot.getTeam());
        decrementRobotTypeCount(robot.getTeam(), robot.getType());

        MapLocation loc = robot.getLocation();
        gameRobotsByID.remove(id);
        dynamicBodyExecOrder.remove(id);
        robotIndex.delete(fromPoint(loc),id);
    }
    
    // ****************************
    // *** PLAYER METHODS *********
    // ****************************

    private Rectangle fromPoint(float x, float y) {
        return new Rectangle(x,y,x,y);
    }

    private Rectangle fromPoint(Point p) {
        return new Rectangle(p.x,p.y,p.x,p.y);
    }

    private Rectangle fromPoint(MapLocation loc) {
        return new Rectangle(loc.x,loc.y,loc.x,loc.y);
    }

    // ****************************
    // *** PRIVATE METHODS ********
    // ****************************

    private void incrementRobotCount(Team team) {
        robotCount[team.ordinal()]++;
    }

    private void decrementRobotCount(Team team) {
        robotCount[team.ordinal()]--;
    }

    private void incrementRobotTypeCount(Team team, RobotType type) {
        robotTypeCount.get(team);
        if (robotTypeCount.get(team).containsKey(type)) {
            robotTypeCount.get(team).put(type,
                    robotTypeCount.get(team).get(type) + 1);
        } else {
            robotTypeCount.get(team).put(type, 1);
        }
    }

    private void decrementRobotTypeCount(Team team, RobotType type) {
        Integer currentCount = getRobotTypeCount(team, type);
        robotTypeCount.get(team).put(type,currentCount - 1);
    }

}
