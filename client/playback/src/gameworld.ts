import StructOfArrays from './soa';
import Metadata from './metadata';
import { schema } from 'battlecode-schema';

// necessary because victor doesn't use exports.default
import Victor = require('victor');
import deepcopy = require('deepcopy');

// TODO use Victor for representing positions
export type DeadBodiesSchema = {
  id: Int32Array,
  x: Int32Array,
  y: Int32Array,
}

export type BodiesSchema = {
  id: Int32Array,
  team: Int8Array,
  type: Int8Array,
  x: Int32Array,
  y: Int32Array,
  influence: Int32Array;
  conviction: Int32Array;
  flag: Int8Array;
  bytecodesUsed: Int32Array, // TODO: is this needed?
  ability: Int8Array
};

// NOTE: consider changing MapStats to schema to use SOA for better performance, if it has large data
export type MapStats = {
  name: string,
  minCorner: Victor,
  maxCorner: Victor,
  bodies: schema.SpawnedBodyTable,
  randomSeed: number,

  passability: Float64Array, // double

  getIdx: (x:number, y:number) => number;
  getLoc: (idx: number) => Victor;
};

export type TeamStats = {
  // An array of numbers corresponding to team stats, which map to RobotTypes
  // Corresponds to robot type (including NONE. length 5)
  robots: [number, number, number, number, number],
  votes: number
};

export type IndicatorDotsSchema = {
  id: Int32Array,
  x: Int32Array,
  y: Int32Array,
  red: Int32Array,
  green: Int32Array,
  blue: Int32Array
}

export type IndicatorLinesSchema = {
  id: Int32Array,
  startX: Int32Array,
  startY: Int32Array,
  endX: Int32Array,
  endY: Int32Array,
  red: Int32Array,
  green: Int32Array,
  blue: Int32Array
}

/**
 * A frozen image of the game world.
 *
 * TODO(jhgilles): better access control on contents.
 */
export default class GameWorld {
  /**
   * Bodies that died this round.
   */
  diedBodies: StructOfArrays<DeadBodiesSchema>;

  /**
   * Everything that isn't an indicator string.
   */
  bodies: StructOfArrays<BodiesSchema>;

  /*
   * Stats for each team
   */
  teamStats: Map<number, TeamStats>; // Team ID to their stats

  /*
   * Stats for each team
   */
  mapStats: MapStats; // Team ID to their stats

  /**
   * Indicator dots.
   */
  indicatorDots: StructOfArrays<IndicatorDotsSchema>;

  /**
   * Indicator lines.
   */
  indicatorLines: StructOfArrays<IndicatorLinesSchema>;

  /**
   * The current turn.
   */
  turn: number;

  // duplicate with mapStats, but left for compatibility.
  // TODO: change dependencies and remove these map variables
  /**
   * The minimum corner of the game world.
   */
  minCorner: Victor;

  /**
   * The maximum corner of the game world.
   */
  maxCorner: Victor;

  /**
   * The name of the map.
   */
  mapName: string;

  /**
   * Metadata about the current game.
   */
  meta: Metadata;

  // Cache fields
  // We pass these into flatbuffers functions to avoid allocations, 
  // but that's it, they don't hold any state
  private _bodiesSlot: schema.SpawnedBodyTable;
  private _vecTableSlot1: schema.VecTable;
  private _vecTableSlot2: schema.VecTable;
  private _rgbTableSlot: schema.RGBTable;

  /**
   * IDs of robots who performed a temporary ability in the previous round,
   * which should be removed in the current round.
   */
  private abilityRobots: number[] = [];

  constructor(meta: Metadata) {
    this.meta = meta;

    this.diedBodies = new StructOfArrays({
      id: new Int32Array(0),
      x: new Int32Array(0),
      y: new Int32Array(0),
    }, 'id');

    this.bodies = new StructOfArrays({
      id: new Int32Array(0),
      team: new Int8Array(0),
      type: new Int8Array(0),
      x: new Int32Array(0),
      y: new Int32Array(0),
      influence: new Int32Array(0),
      conviction: new Int32Array(0),
      flag: new Int8Array(0),
      bytecodesUsed: new Int32Array(0),
      ability: new Int8Array(0)
    }, 'id');


    // Instantiate teamStats
    this.teamStats = new Map<number, TeamStats>();
    for (let team in this.meta.teams) {
        var teamID = this.meta.teams[team].teamID;
        this.teamStats.set(teamID, {
          robots: [
            0, // ENLIGHTENMENT_CENTER
            0, // POLITICIAN
            0, // SLANDERER
            0, // MUCKRAKER
            0, // NONE
          ],
          votes: 0
        });
    }

    // Instantiate mapStats
    this.mapStats = {
      name: '????',
      minCorner: new Victor(0,0),
      maxCorner: new Victor(0,0),
      bodies: new schema.SpawnedBodyTable(),
      randomSeed: 0,
      passability: new Float64Array(0),
      getIdx: (x:number, y:number) => 0,
      getLoc: (idx: number) => new Victor(0,0)
    };


    this.indicatorDots = new StructOfArrays({
      id: new Int32Array(0),
      x: new Int32Array(0),
      y: new Int32Array(0),
      red: new Int32Array(0),
      green: new Int32Array(0),
      blue: new Int32Array(0)
    }, 'id');

    this.indicatorLines = new StructOfArrays({
      id: new Int32Array(0),
      startX: new Int32Array(0),
      startY: new Int32Array(0),
      endX: new Int32Array(0),
      endY: new Int32Array(0),
      red: new Int32Array(0),
      green: new Int32Array(0),
      blue: new Int32Array(0)
    }, 'id');

    this.turn = 0;
    this.minCorner = new Victor(0, 0);
    this.maxCorner = new Victor(0, 0);
    this.mapName = '????';

    this._bodiesSlot = new schema.SpawnedBodyTable()
    this._vecTableSlot1 = new schema.VecTable();
    this._vecTableSlot2 = new schema.VecTable();
    this._rgbTableSlot = new schema.RGBTable();
  }

  loadFromMatchHeader(header: schema.MatchHeader) {
    const map = header.map();

    const name = map.name() as string;
    if (name) {
      this.mapName = map.name() as string;
      this.mapStats.name = map.name() as string;
    }

    const minCorner = map.minCorner();
    this.minCorner.x = minCorner.x();
    this.minCorner.y = minCorner.y();
    this.mapStats.minCorner.x = minCorner.x();
    this.mapStats.minCorner.y = minCorner.y();

    const maxCorner = map.maxCorner();
    this.maxCorner.x = maxCorner.x();
    this.maxCorner.y = maxCorner.y();
    this.mapStats.maxCorner.x = maxCorner.x();
    this.mapStats.maxCorner.y = maxCorner.y();

    const bodies = map.bodies(this._bodiesSlot);
    if (bodies && bodies.robotIDsLength) {
      this.insertBodies(bodies);
    }

    this.mapStats.randomSeed = map.randomSeed();

    this.mapStats.passability = Float64Array.from(map.passabilityArray());

    const width = (maxCorner.x() - minCorner.x());
    this.mapStats.getIdx = (x:number, y:number) => (
      Math.floor(y)*width + Math.floor(x)
    );
    this.mapStats.getLoc = (idx: number) => (
      new Victor(idx % width, Math.floor(idx / width))
    );
    
    // Check with header.totalRounds() ?
  }

  /**
   * Create a copy of the world in its current state.
   */
  copy(): GameWorld {
    const result = new GameWorld(this.meta);
    result.copyFrom(this);
    return result;
  }

  copyFrom(source: GameWorld) {
    this.turn = source.turn;
    this.minCorner = source.minCorner;
    this.maxCorner = source.maxCorner;
    this.mapName = source.mapName;
    this.diedBodies.copyFrom(source.diedBodies);
    this.bodies.copyFrom(source.bodies);
    this.indicatorDots.copyFrom(source.indicatorDots);
    this.indicatorLines.copyFrom(source.indicatorLines);
    this.teamStats = new Map<number, TeamStats>();
    source.teamStats.forEach((value: TeamStats, key: number) => {
      this.teamStats.set(key, deepcopy(value));
    });
    this.mapStats = deepcopy(source.mapStats);
  }

  /**
   * Process a set of changes.
   */
  processDelta(delta: schema.Round) {
    if (delta.roundID() != this.turn + 1) {
      throw new Error(`Bad Round: this.turn = ${this.turn}, round.roundID() = ${delta.roundID()}`);
    }

    // Process votes gained
    for (var i = 0; i < delta.teamIDsLength(); i++) {
      var teamID = delta.teamIDs(i);
      var statObj = this.teamStats.get(teamID);

      statObj.votes += delta.teamVotes(i);

      this.teamStats.set(teamID, statObj);
  }

    // Location changes on bodies
    const movedLocs = delta.movedLocs(this._vecTableSlot1);
    if (movedLocs) {
      this.bodies.alterBulk({
        id: delta.movedIDsArray(),
        x: movedLocs.xsArray(),
        y: movedLocs.ysArray(),
      });
    }

    // Spawned bodies
    const bodies = delta.spawnedBodies(this._bodiesSlot);
    if (bodies) {
      this.insertBodies(bodies);
    }

    // Remove abilities from previous round
    this.bodies.alterBulk({id: new Int32Array(this.abilityRobots), ability: new Int8Array(this.abilityRobots.length)});
    this.abilityRobots = [];

    // Actions
    if(delta.actionsLength() > 0){
      const arrays = this.bodies.arrays;
      
      for(let i=0; i<delta.actionsLength(); i++){
        const action = delta.actions(i);
        const robotID = delta.actionIDs(i);
        const target = delta.actionTargets(i);
        switch (action) {
          // TODO: validate actions?
          // Actions list from battlecode.fbs enum Action
          
          /// Politicians self-destruct and affect nearby bodies
          /// Target: none
          case schema.Action.EMPOWER:
            this.bodies.alter({ id: robotID, ability: 1});
            this.abilityRobots.push(robotID);
            break;
          /// Slanderers passively generate influence for the
          /// Enlightenment Center that created them.
          /// Target: parent ID
          case schema.Action.EMBEZZLE:
            this.bodies.alter({ id: robotID, ability: 3});
            this.abilityRobots.push(robotID);
            break;
          /// Slanderers turn into Politicians.
          /// Target: none
          case schema.Action.CAMOUFLAGE:
            const team = this.bodies.lookup(robotID).team;
            this.bodies.alter({ id: robotID, ability: (team == 1 ? 4 : 5)});
          /// Muckrakers can expose a scandal.
          /// Target: an enemy body.
          case schema.Action.EXPOSE:
            this.bodies.alter({ id: robotID, ability: 2});
            this.abilityRobots.push(robotID);
            break;
          /// Units can change their flag.
          /// Target: a new flag value.
          case schema.Action.SET_FLAG:
            this.bodies.alter({ id: robotID, flag: target});
            break;
          /// Builds a unit (enlightent center).
          /// Target: spawned unit
          case schema.Action.SPAWN_UNIT:
            break;
          /// Places a bid (enlightent center).
          /// Target: bid placed
          case schema.Action.PLACE_BID:
            break;
          /// A robot can change team after being empowered
          /// Target: teamID
          case schema.Action.CHANGE_TEAM:
            // TODO remove the robot, don't alter it
            this.bodies.alter({ id: robotID, team: target});
            break;
          /// A robot's influence changes.
          /// Target: delta value
          case schema.Action.CHANGE_INFLUENCE:
            const old_influence = this.bodies.lookup(robotID).influence; 
            this.bodies.alter({ id: robotID, influence: old_influence + target});
            break;
          /// A robot's conviction changes.
          /// Target: delta value, i.e. red 5 -> blue 3 is -2
          case schema.Action.CHANGE_CONVICTION:
            const old_conviction = this.bodies.lookup(robotID).conviction; 
            this.bodies.alter({ id: robotID, influence: old_conviction + target});
            break;
    
          case schema.Action.DIE_EXCEPTION:
            console.log(`Exception occured: robotID(${robotID}), target(${target}`);
            break;

          default:
            console.log(`Undefined action: action(${action}), robotID(${robotID}, target(${target}))`);
            break;
        }
      }
    }

    // TODO Passive Changes, need game constants.
    
    // Died bodies
    if (delta.diedIDsLength() > 0) {

      // Update team stats
      var indices = this.bodies.lookupIndices(delta.diedIDsArray());
      for(let i = 0; i < delta.diedIDsLength(); i++) {
          let index = indices[i];
          // console.log("robot died: " + this.bodies.arrays.id[index]);
          let team = this.bodies.arrays.team[index];
          let type = this.bodies.arrays.type[index];
          var statObj = this.teamStats.get(team);
          if(!statObj) {continue;} // In case this is a neutral bot
          statObj.robots[type] -= 1;
          this.teamStats.set(team, statObj);
      }

      // Update bodies soa
      this.insertDiedBodies(delta);

      this.bodies.deleteBulk(delta.diedIDsArray());
    }

    // Insert indicator dots and lines
    this.insertIndicatorDots(delta);
    this.insertIndicatorLines(delta);

    // Logs
    // TODO

    // Message pool
    // TODO

    // Increase the turn count
    this.turn = delta.roundID();

    // Update bytecode costs
    if (delta.bytecodeIDsLength() > 0) {
      this.bodies.alterBulk({
        id: delta.bytecodeIDsArray(),
        bytecodesUsed: delta.bytecodesUsedArray()
      });
    }
  }

  private insertDiedBodies(delta: schema.Round) {
    // Delete the died bodies from the previous round
    this.diedBodies.clear();

    // Insert the died bodies from the current round
    const startIndex = this.diedBodies.insertBulk({
      id: delta.diedIDsArray()
    });

    // Extra initialization
    const endIndex = startIndex + delta.diedIDsLength();
    const idArray = this.diedBodies.arrays.id;
    const xArray = this.diedBodies.arrays.x;
    const yArray = this.diedBodies.arrays.y;
    for (let i = startIndex; i < endIndex; i++) {
      const body = this.bodies.lookup(idArray[i]);
      xArray[i] = body.x;
      yArray[i] = body.y;
    }
  }

  private insertIndicatorDots(delta: schema.Round) {
    // Delete the dots from the previous round
    this.indicatorDots.clear();

    // Insert the dots from the current round
    if (delta.indicatorDotIDsLength() > 0) {
      const locs = delta.indicatorDotLocs(this._vecTableSlot1);
      const rgbs = delta.indicatorDotRGBs(this._rgbTableSlot);
      this.indicatorDots.insertBulk({
        id: delta.indicatorDotIDsArray(),
        x: locs.xsArray(),
        y: locs.ysArray(),
        red: rgbs.redArray(),
        green: rgbs.greenArray(),
        blue: rgbs.blueArray()
      })
    }
  }

  private insertIndicatorLines(delta: schema.Round) {
    // Delete the lines from the previous round
    this.indicatorLines.clear();

    // Insert the lines from the current round
    if (delta.indicatorLineIDsLength() > 0) {
      const startLocs = delta.indicatorLineStartLocs(this._vecTableSlot1);
      const endLocs = delta.indicatorLineEndLocs(this._vecTableSlot2);
      const rgbs = delta.indicatorLineRGBs(this._rgbTableSlot);
      this.indicatorLines.insertBulk({
        id: delta.indicatorLineIDsArray(),
        startX: startLocs.xsArray(),
        startY: startLocs.ysArray(),
        endX: endLocs.xsArray(),
        endY: endLocs.ysArray(),
        red: rgbs.redArray(),
        green: rgbs.greenArray(),
        blue: rgbs.blueArray()
      })
    }
  }

  private insertBodies(bodies: schema.SpawnedBodyTable) {

    // Store frequently used arrays
    var teams = bodies.teamIDsArray();
    var types = bodies.typesArray();
    var influences = bodies.influencesArray();

    // Update spawn stats
    for(let i = 0; i < bodies.robotIDsLength(); i++) {
      if(teams[i] == 0) continue;
      var statObj = this.teamStats.get(teams[i]);
      statObj.robots[types[i]] += 1;
      this.teamStats.set(teams[i], statObj);
    }

    const locs = bodies.locs(this._vecTableSlot1);
    // Note: this allocates 6 objects with each call.
    // (One for the container, one for each TypedArray.)
    // All of the objects are small; the TypedArrays are basically
    // (pointer, length) pairs.
    // You can't reuse TypedArrays easily, so I'm inclined to
    // let this slide for now.
    
    // Initialize convictions
    var convictions: Int32Array = influences.map((influence, i) => influence * this.meta.types[types[i]].convictionRatio); //new Int32Array(bodies.robotIDsLength());

    // Insert bodies
    this.bodies.insertBulk({
      id: bodies.robotIDsArray(),
      team: teams,
      type: types,
      influence: influences,
      conviction: convictions,
      x: locs.xsArray(),
      y: locs.ysArray(),
      flag: new Int8Array(bodies.robotIDsLength()),
      bytecodesUsed: new Int32Array(bodies.robotIDsLength()),
      ability: new Int8Array(bodies.robotIDsLength())
    });
  }

}
