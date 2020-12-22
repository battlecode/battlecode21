"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const soa_1 = require("./soa");
const battlecode_schema_1 = require("battlecode-schema");
// necessary because victor doesn't use exports.default
const Victor = require("victor");
const deepcopy = require("deepcopy");
/**
 * A frozen image of the game world.
 *
 * TODO(jhgilles): better access control on contents.
 */
class GameWorld {
    constructor(meta) {
        this.meta = meta;
        this.diedBodies = new soa_1.default({
            id: new Int32Array(0),
            x: new Int32Array(0),
            y: new Int32Array(0),
        }, 'id');
        this.bodies = new soa_1.default({
            id: new Int32Array(0),
            team: new Int8Array(0),
            type: new Int8Array(0),
            x: new Int32Array(0),
            y: new Int32Array(0),
            bytecodesUsed: new Int32Array(0),
        }, 'id');
        // Instantiate teamStats
        this.teamStats = new Map();
        for (let team in this.meta.teams) {
            var teamID = this.meta.teams[team].teamID;
            this.teamStats.set(teamID, {
                robots: [
                    0,
                    0,
                    0,
                    0,
                    0,
                ]
            });
        }
        // Instantiate mapStats
        this.mapStats = {
            name: '????',
            minCorner: new Victor(0, 0),
            maxCorner: new Victor(0, 0),
            bodies: new battlecode_schema_1.schema.SpawnedBodyTable(),
            randomSeed: 0,
            passability: new Float64Array(0),
            getIdx: (x, y) => 0,
            getLoc: (idx) => new Victor(0, 0)
        };
        this.indicatorDots = new soa_1.default({
            id: new Int32Array(0),
            x: new Int32Array(0),
            y: new Int32Array(0),
            red: new Int32Array(0),
            green: new Int32Array(0),
            blue: new Int32Array(0)
        }, 'id');
        this.indicatorLines = new soa_1.default({
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
        this._bodiesSlot = new battlecode_schema_1.schema.SpawnedBodyTable();
        this._vecTableSlot1 = new battlecode_schema_1.schema.VecTable();
        this._vecTableSlot2 = new battlecode_schema_1.schema.VecTable();
        this._rgbTableSlot = new battlecode_schema_1.schema.RGBTable();
    }
    loadFromMatchHeader(header) {
        const map = header.map();
        const name = map.name();
        if (name) {
            this.mapName = map.name();
            this.mapStats.name = map.name();
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
        console.log("passability", this.mapStats.passability, map.passabilityArray());
        const width = (maxCorner.x() - minCorner.x());
        this.mapStats.getIdx = (x, y) => (Math.floor(y) * width + Math.floor(x));
        this.mapStats.getLoc = (idx) => (new Victor(idx % width, Math.floor(idx / width)));
        // Check with header.totalRounds() ?
    }
    /**
     * Create a copy of the world in its current state.
     */
    copy() {
        const result = new GameWorld(this.meta);
        result.copyFrom(this);
        return result;
    }
    copyFrom(source) {
        this.turn = source.turn;
        this.minCorner = source.minCorner;
        this.maxCorner = source.maxCorner;
        this.mapName = source.mapName;
        this.diedBodies.copyFrom(source.diedBodies);
        this.bodies.copyFrom(source.bodies);
        this.indicatorDots.copyFrom(source.indicatorDots);
        this.indicatorLines.copyFrom(source.indicatorLines);
        this.teamStats = new Map();
        source.teamStats.forEach((value, key) => {
            this.teamStats.set(key, deepcopy(value));
        });
        this.mapStats = deepcopy(source.mapStats);
    }
    /**
     * Process a set of changes.
     */
    processDelta(delta) {
        if (delta.roundID() != this.turn + 1) {
            throw new Error(`Bad Round: this.turn = ${this.turn}, round.roundID() = ${delta.roundID()}`);
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
        let shootID = 0;
        // Action
        if (delta.actionsLength() > 0) {
            const arrays = this.bodies.arrays;
            for (let i = 0; i < delta.actionsLength(); i++) {
                const action = delta.actions(i);
                const robotID = delta.actionIDs(i);
                const target = delta.actionTargets(i);
                switch (action) {
                    // TODO: validate actions?
                    // Actions list from battlecode.fbs enum Action
                    /*
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
                    */
                    // TODO: fill actions
                    /// Politicians self-destruct and affect nearby bodies
                    /// Target: none
                    case battlecode_schema_1.schema.Action.EMPOWER:
                        break;
                    /// Scandals turn into politicians.
                    /// Target: self.
                    case battlecode_schema_1.schema.Action.CAMOUFLAGE:
                        break;
                    /// Slanders are alowed to TODO.
                    /// Target: TODO.
                    case battlecode_schema_1.schema.Action.EMBEZZLE:
                        break;
                    /// Slanderers can expose a scandal.
                    /// Target: an enemy body.
                    case battlecode_schema_1.schema.Action.EXPOSE:
                        break;
                    /// Units can change their flag.
                    /// Target: self.
                    case battlecode_schema_1.schema.Action.SET_FLAG:
                        break;
                    /// Units can get the flag of another unit
                    /// Target: another unit.
                    case battlecode_schema_1.schema.Action.GET_FLAG:
                        break;
                    /// Builds a unit (enlightent center).
                    /// Target: spawned unit
                    case battlecode_schema_1.schema.Action.SPAWN_UNIT:
                        break;
                    /// Places a bid (enlightent center).
                    /// Target: bid placed
                    case battlecode_schema_1.schema.Action.PLACE_BID:
                        break;
                    /// A robot can change team after being empowered
                    /// Target: self
                    case battlecode_schema_1.schema.Action.CHANGE_TEAM:
                        break;
                    /// An enlightenment center can become neutral if lost all its influence
                    /// Target: none.
                    case battlecode_schema_1.schema.Action.BECOME_NEUTRAL:
                        break;
                    case battlecode_schema_1.schema.Action.DIE_EXCEPTION:
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
            for (let i = 0; i < delta.diedIDsLength(); i++) {
                let index = indices[i];
                // console.log("robot died: " + this.bodies.arrays.id[index]);
                let team = this.bodies.arrays.team[index];
                let type = this.bodies.arrays.type[index];
                var statObj = this.teamStats.get(team);
                if (!statObj) {
                    continue;
                } // In case this is a neutral bot
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
    insertDiedBodies(delta) {
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
    insertIndicatorDots(delta) {
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
            });
        }
    }
    insertIndicatorLines(delta) {
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
            });
        }
    }
    insertBodies(bodies) {
        // Update spawn stats
        var teams = bodies.teamIDsArray();
        var types = bodies.typesArray();
        for (let i = 0; i < bodies.robotIDsLength(); i++) {
            if (teams[i] == 0)
                continue;
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
        //TODO: Body info tracking
        // const initList = [
        //   arrays.onDirt,
        //   arrays.carryDirt,
        //   arrays.cargo,
        //   arrays.isCarried,
        //   arrays.bytecodesUsed,
        // ];
        // initList.forEach((arr) => {
        //   StructOfArrays.fill(
        //     arr,
        //     0,
        //     startIndex,
        //     this.bodies.length
        //   );
        // });
    }
}
exports.default = GameWorld;
// TODO(jhgilles): encode in flatbuffers
const NEUTRAL_TEAM = 0;
