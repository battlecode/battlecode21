import StructOfArrays from './soa';
import Metadata from './metadata';
import { schema } from 'battlecode-schema';

// necessary because victor doesn't use exports.default
import Victor = require('victor');
import deepcopy = require('deepcopy');

// let Position to be vector type?
export type DiedBodiesSchema = {
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
  onDirt: Int32Array, // the amount of dirt on top of the unit
  carryDirt: Int32Array, // the amount of dirt landscaper is carrying 
  cargo: Int32Array,  // info about current cargo. 0 when not carrying
                      // unitID for drones, amount of dirt for landscaper, and amount of soup for miner
  isCarried: Uint8Array, // whether the unit is being cariied or not
  bytecodesUsed: Int32Array, // Only relevant for non-neutral bodies
};

// TODO change this to schema?
export type MapStats = {
  name: string,
  minCorner: Victor,
  maxCorner: Victor,
  bodies: schema.SpawnedBodyTable,
  randomSeed: number,

  dirt: Int32Array,
  flooded: Int8Array, // actually a boolean array but flatbuffers does not understand that
  globalPollution: number,
  localPollutions: schema.LocalPollutionTable,
  pollution: Int32Array, // not guaranteed to be correct
  soup: Int32Array

  getIdx: (x:number, y:number) => number;
  getLoc: (idx: number) => Victor;
};

export type TeamStats = {
  // TODO: get size of array and auto-scale this array's size?

  // An array of numbers corresponding to team stats, which map to RobotTypes
  // Corresponds to robot type (including NONE; empty drones and iscarry drones are counted the same. length 11)
  soup: number,
  robots: [number, number, number, number, number, number, number, number, number, number, number]
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

export type NetGunShotSchema = {
  id: Int32Array,
  startX: Int32Array,
  startY: Int32Array,
  endX: Int32Array,
  endY: Int32Array
}

/**
 * A frozen image of the game world.
 *
 * TODO(jhgilles): better access control on contents.
 */
export default class GameWorld {
  /**
   * Bodies that died this round.
   * {
   *   id: Int32Array,
   *   x: Int32Array,
   *   y: Int32Array,
   * }
   */
  diedBodies: StructOfArrays<DiedBodiesSchema>;

  /**
   * Everything that isn't a bullet or indicator string.
   * {
   *   id: Int32Array,
   *   team: Int8Array,
   *   type: Int8Array,
   *   x: Int32Array,
   *   y: Int32Array,
   *   bytecodesUsed: Int32Array,
   * }
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

  /*
   * Whether pollution needs to be recomputed.
   */
  pollutionNeedsUpdate: boolean;

  /**
   * Indicator dots.
   * {
   *   id: Int32Array,
   *   x: Float32Array,
   *   y: Float32Array,
   *   red: Int32Array,
   *   green: Int32Array,
   *   blue: Int32Array
   * }
   */
  indicatorDots: StructOfArrays<IndicatorDotsSchema>;

  /**
   * Indicator lines.
   * {
   *   id: Int32Array,
   *   startX: Float32Array,
   *   startY: Float32Array,
   *   endX: Float32Array,
   *   endY: Float32Array,
   *   red: Int32Array,
   *   green: Int32Array,
   *   blue: Int32Array
   * }
   */
  indicatorLines: StructOfArrays<IndicatorLinesSchema>;

  /**
   * Net gun shots. Just an indicator line actually.
   */
  netGunShots: StructOfArrays<NetGunShotSchema>;

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
  // We pass these into flatbuffers functions to avoid allocations, but that's
  // it, they don't hold any state
  private _bodiesSlot: schema.SpawnedBodyTable;
  private _localPollutionsSlot: schema.LocalPollutionTable;
  private _vecTableSlot1: schema.VecTable;
  private _vecTableSlot2: schema.VecTable;
  private _rgbTableSlot: schema.RGBTable;

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
      onDirt: new Int32Array(0),
      carryDirt: new Int32Array(0),
      cargo: new Int32Array(0),
      isCarried: new Uint8Array(0),
      bytecodesUsed: new Int32Array(0),
    }, 'id');


    // Instantiate teamStats
    this.teamStats = new Map<number, TeamStats>();
    for (let team in this.meta.teams) {
        var teamID = this.meta.teams[team].teamID;
        this.teamStats.set(teamID, {
          soup: 0,
          robots: [
            0, // MINER
            0, // LANDSCAPER
            0, // DRONE
            0, // NET_GUN
            0, // COW
            0, // REFINERY
            0, // VAPORATOR
            0, // HQ
            0, // DESIGN_SCHOOL
            0, // FULFILLMENT_CENTER
            0, // NONE
        ]});
    }

    // Instantiate mapStats
    this.mapStats = {
      name: '????',
      minCorner: new Victor(0,0),
      maxCorner: new Victor(0,0),
      bodies: new schema.SpawnedBodyTable(),
      randomSeed: 0,
      flooded: new Int8Array(0),
      dirt: new Int32Array(0),
      globalPollution: 0,
      localPollutions: new schema.LocalPollutionTable(),
      pollution: new Int32Array(0),
      soup: new Int32Array(0),
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

    this.netGunShots = new StructOfArrays({
      id: new Int32Array(0),
      startX: new Int32Array(0),
      startY: new Int32Array(0),
      endX: new Int32Array(0),
      endY: new Int32Array(0)
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

    this.mapStats.flooded = Int8Array.from(map.waterArray());
    this.mapStats.dirt = Int32Array.from(map.dirtArray());
    this.mapStats.soup = Int32Array.from(map.soupArray());
    this.mapStats.pollution = Int32Array.from(map.pollutionArray());
    this.pollutionNeedsUpdate = false;

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
    this.netGunShots.copyFrom(source.netGunShots);
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

    // Soup changes on team
    for (var i = 0; i < delta.teamIDsLength(); i++) {
        var teamID = delta.teamIDsArray()[i];
        var statObj = this.teamStats.get(teamID);

        statObj.soup = delta.teamSoups(i);

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


    

    // clear net gun
    this.netGunShots.clear();
    let shootID = 0;
    // Action
    if(delta.actionsLength() > 0){
      const arrays = this.bodies.arrays;
      
      for(let i=0; i<delta.actionsLength(); i++){
        const action = delta.actions(i);
        const robotID = delta.actionIDs(i);
        const target = delta.actionTargets(i);
        switch (action) {
          // TODO: validate actions?
          // TODO: vaporator things?
          // Actions list from battlecode.fbs enum Action
          
          case schema.Action.MINE_SOUP:
            // could have died
            // or actually probably not but let's be safe
            if (this.bodies.index(robotID) != -1) {
              arrays.cargo[robotID] += 1; // TODO: this assumes you can only always mine 1 soup THIS IS ALSO WRONG FORMAT FOR CHANGING SOA; SEE DIG_DIRT
            }
            break;

          case schema.Action.REFINE_SOUP:
            break;
          
          case schema.Action.DEPOSIT_SOUP:
            if (this.bodies.index(robotID) != -1) {
              arrays.cargo[robotID] -= 1; // TODO: this assumes you can only always deposit 1 soup WRONG FORMAT FOR CHANGING SOA: SEE DIG_DIRT
            }
            break;


          case schema.Action.DIG_DIRT:
            // this.mapStats.dirt[target] -= 1; // this is done somewhere else
            if (this.bodies.index(robotID) != -1) {
              this.bodies.alter({id: robotID, carryDirt: this.bodies.arrays.carryDirt[this.bodies.index(robotID)] + 1})
            }
            if (this.bodies.index(target) != -1) {
              // check if this is a building
              if (this.isBuilding(this.bodies.arrays.type[this.bodies.index(target)])) {
                // remove onDirt!
                // console.log(this.bodies.arrays.onDirt[this.bodies.index(target)]);
                this.bodies.alter({id: target, onDirt: this.bodies.arrays.onDirt[this.bodies.index(target)] - 1})
              }
            }
            break;
          case schema.Action.DEPOSIT_DIRT:
            // this.mapStats.dirt[target] += 1; // this is done somewhere else
            if (this.bodies.index(robotID) != -1) {
              this.bodies.alter({id: robotID, carryDirt: this.bodies.arrays.carryDirt[this.bodies.index(robotID)] - 1})
            }
            if (this.bodies.index(target) != -1) {
              // check if this is a building
              if (this.isBuilding(this.bodies.arrays.type[this.bodies.index(target)])) {
                // add onDirt!
                this.bodies.alter({id: target, onDirt: this.bodies.arrays.onDirt[this.bodies.index(target)] + 1})
              }
            }
            break;

          case schema.Action.PICK_UNIT:
            // console.log('unit ' + robotID + " is picking " + target + " at location (" + this.bodies.lookup(robotID).x + "," + this.bodies.lookup(robotID).y + ")");
            // the drone might have been killed on the same round, after picking!
            if (this.bodies.index(robotID) != -1) {
              this.bodies.alter({ id: robotID, cargo: target });
            }
            // can this happen? unclear
            if (this.bodies.index(target) != -1) {
              this.bodies.alter({ id: target, isCarried: 1 });
            }
            break;
          case schema.Action.DROP_UNIT:
            // this might be the result of a netgun shooting the drone, in which case robotID will have been deleted already
            if (this.bodies.index(robotID) != -1) {
              this.bodies.alter({ id: robotID, cargo: 0 });
            }
            // the drone might be dropping something into the water, in which case robotID already deleted
            if (this.bodies.index(target) != -1) {
              this.bodies.alter({ id: target, isCarried: 0 });
            }
            // console.log('attempting to drop ' + robotID);
            break;
          
          // spawnings are handled by spawnedBodies
          case schema.Action.SPAWN_UNIT:
            break;
          
          // deaths are handled by diedIDs
          case schema.Action.SHOOT:
            if (this.bodies.index(robotID) !== -1 && this.bodies.index(target) !== -1) {
              this.netGunShots.insert({
                id: shootID++,
                startX: this.bodies.lookup(robotID).x,
                startY: this.bodies.lookup(robotID).y,
                endX: this.bodies.lookup(target).x,
                endY: this.bodies.lookup(target).y
              })
            }
            // console.log('robot ' + robotID + ' is attempting to shoot ' + target);
            break;
          case schema.Action.DIE_DROWN:
            break;
          case schema.Action.DIE_SHOT:
            break;
          case schema.Action.DIE_TOO_MUCH_DIRT:
            break;
          case schema.Action.DIE_SUICIDE:
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


    // Dirt changes on map
    for(let i = 0; i<delta.dirtChangesLength(); i++){
      const x = delta.dirtChangedLocs().xs(i);
      const y = delta.dirtChangedLocs().ys(i);
      const mapIdx = this.mapStats.getIdx(x, y);
      this.mapStats.dirt[mapIdx] += delta.dirtChanges(i);
    }
    // Water changes on map
    if (delta.waterChangedLocs() !== null) {
      for(let i = 0; i<delta.waterChangedLocs().xsLength(); i++){
        const x = delta.waterChangedLocs().xs(i);
        const y = delta.waterChangedLocs().ys(i);
        const mapIdx = this.mapStats.getIdx(x, y);
        this.mapStats.flooded[mapIdx] = 1 - this.mapStats.flooded[mapIdx]; // this position changed flood situation
      }
    }
    // Pollution changes on map
    // We don't calculate the pollution until it is actually needed. Lazy is always good.
    this.mapStats.globalPollution = delta.globalPollution();
    this.mapStats.localPollutions = delta.localPollutions(this._localPollutionsSlot);
    this.pollutionNeedsUpdate = true;
    // Soup changes on map
    for(let i = 0; i<delta.soupChangesLength(); i++){
      const x = delta.soupChangedLocs().xs(i);
      const y = delta.soupChangedLocs().ys(i);
      const mapIdx = this.mapStats.getIdx(x, y);
      this.mapStats.soup[mapIdx] += delta.soupChanges(i);
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

  private distanceSquared(a: number, b: number, x: number, y: number) {
    return (a - x)*(a-x) + (b-y)*(b-y);
  }

  public calculatePollutionIfNeeded() {
    if (!this.pollutionNeedsUpdate) {
      return;
    }
    // calculates pollution based on pollution effects
    // this has annoying time complexity but I think it'll be fine
    let width = this.mapStats.maxCorner.x - this.mapStats.minCorner.x;
    let height = this.mapStats.maxCorner.y - this.mapStats.minCorner.y;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let idx = this.mapStats.getIdx(x, y);
            this.mapStats.pollution[idx] = this.mapStats.globalPollution;
            let multiplier = 1;
            if (!this.mapStats.localPollutions) continue;
            for (let i = 0; i < this.mapStats.localPollutions.radiiSquaredLength(); i++) {
                if (this.distanceSquared(this.mapStats.localPollutions.locations().xsArray()[i], this.mapStats.localPollutions.locations().ysArray()[i], x, y) <= this.mapStats.localPollutions.radiiSquaredArray()[i]) {
                    this.mapStats.pollution[idx] += this.mapStats.localPollutions.additiveEffectsArray()[i];
                    multiplier *= this.mapStats.localPollutions.multiplicativeEffectsArray()[i];
                }
            }
            this.mapStats.pollution[idx] = Math.round(this.mapStats.pollution[idx] * multiplier);
        }
    }
    this.pollutionNeedsUpdate = false;
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

  private isBuilding(body: schema.BodyType) {
    return body == schema.BodyType.DESIGN_SCHOOL || body == schema.BodyType.FULFILLMENT_CENTER || body == schema.BodyType.HQ || body == schema.BodyType.NET_GUN || body == schema.BodyType.REFINERY || body == schema.BodyType.VAPORATOR;
  }

  private insertBodies(bodies: schema.SpawnedBodyTable) {

    // Update spawn stats
    var teams = bodies.teamIDsArray();
    var types = bodies.typesArray();
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
    const startIndex = this.bodies.insertBulk({
      id: bodies.robotIDsArray(),
      team: bodies.teamIDsArray(),
      type: bodies.typesArray(),
      x: locs.xsArray(),
      y: locs.ysArray(),
    });

    // Extra initialization
    const arrays = this.bodies.arrays;
    const initList = [
      arrays.onDirt,
      arrays.carryDirt,
      arrays.cargo,
      arrays.isCarried,
      arrays.bytecodesUsed,
    ];

    initList.forEach((arr) => {
      StructOfArrays.fill(
        arr,
        0,
        startIndex,
        this.bodies.length
      );
    });
  }

}

// TODO(jhgilles): encode in flatbuffers
const NEUTRAL_TEAM = 0;
