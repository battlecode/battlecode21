import {schema, flatbuffers} from 'battlecode-schema';
import * as Map from 'core-js/library/es6/map';
import {createWriteStream} from 'fs';
import {gzip} from 'pako';
import { isNull } from 'util';
import { Signer } from 'crypto';

let SIZE = 32;
const maxID = 4096;

const bodyTypeList = [
  schema.BodyType.MINER,
  schema.BodyType.LANDSCAPER,
  schema.BodyType.DELIVERY_DRONE,
  schema.BodyType.NET_GUN,
  schema.BodyType.COW,
  schema.BodyType.REFINERY,
  schema.BodyType.VAPORATOR,
  schema.BodyType.HQ,
  schema.BodyType.DESIGN_SCHOOL,
  schema.BodyType.FULFILLMENT_CENTER,
];
const bodyVariety = bodyTypeList.length;

// Return random integer in [l,r] (inclusive), uniformly
function random(l: number, r: number): number{
  if(l>r){ console.log("Wrong call of random"); return -1; }
  return Math.min(Math.floor(Math.random() * (r-l+1)) + l, r);
}

function trimEdge(x: number, l: number, r: number): number{
  return Math.min(Math.max(l, x), r);
}

type BodiesType = {
  robotIDs: number[],
  teamIDs: number[],
  types: number[],
  xs: number[],
  ys: number[],
};

type MapType = {
  dirt: number[],
  water: number[],
  pollution: number[],
  soup: number[]
};

// Class to manage IDs of units
class IDsManager {
  private maxID: number;
  private used: Uint8Array;
  private dead: Uint8Array;

  // [0, maxID]
  constructor(maxID: number) {
    this.maxID = maxID;
    this.used = new Uint8Array(maxID+1);
    this.dead = new Uint8Array(maxID+1);
  }

  units(): number {
    let res = 0;
    for(let i=0; i<=this.maxID; i++) res += this.used[i];
    return res;
  }

  isFull(): boolean {
    return this.units() == this.maxID;
  }

  useNextID(): number {
    if(this.isFull()) throw(Error("There are no available IDs"));
    for(let i=0; i<=this.maxID; i++) if(this.used[i] == 0){
      this.used[i] = 1;
      return i;
    }
    throw(Error("This line is not supposed to happen"));
  }

  useRandomID(): number{
    if(this.isFull()) throw(Error("There are no available IDs"));
    const arr = new Array();
    for(let i=0; i<=this.maxID; i++){
      if(this.used[i] == 0) arr.push(i);
    }

    const idx = random(0, arr.length-1);
    this.used[arr[idx]] = 1;
    return arr[idx];
  }

  killID(ID: number): void {
    if(this.used[ID] == 0) throw(Error("Can't kill unused ID"));
    if(this.dead[ID] != 0) throw(Error("Can't kill a unit twice"));

    this.dead[ID] = 1;
  }

  killRandomID(): number {
    const arr = new Array();
    for(let i=0; i<=this.maxID; i++){
      if(this.used[i] == 1 && this.dead[i] == 0) arr.push(i);
    }
    if(arr.length == 0) throw(Error("There are no units to kill"))
    
    const idx = random(0, arr.length-1);
    this.killID(arr[idx]);
    return arr[idx];
  }
};

function createRandomBodies(manager: IDsManager, unitCount: number): BodiesType{
  const bodies: BodiesType = {
    robotIDs: Array(unitCount),
    teamIDs: Array(unitCount),
    types: Array(unitCount),
    xs: Array(unitCount),
    ys: Array(unitCount),
  };

  for(let i=0; i<unitCount; i++){
    bodies.robotIDs[i] = manager.useRandomID();
    bodies.teamIDs[i] = random(1,2);
    bodies.types[i] = bodyTypeList[random(0, bodyVariety-1)];
    bodies.xs[i] = random(0, SIZE-1);
    bodies.ys[i] = random(0, SIZE-1);
  }

  return bodies;
}

function createEventWrapper(builder: flatbuffers.Builder, event: flatbuffers.Offset, type: schema.Event): flatbuffers.Offset {
  schema.EventWrapper.startEventWrapper(builder);
  schema.EventWrapper.addEType(builder, type);
  schema.EventWrapper.addE(builder, event);
  return schema.EventWrapper.endEventWrapper(builder);
}

function createVecTable(builder: flatbuffers.Builder, xs: number[], ys: number[]) {
  const xsP = schema.VecTable.createXsVector(builder, xs);
  const ysP = schema.VecTable.createYsVector(builder, ys);
  schema.VecTable.startVecTable(builder);
  schema.VecTable.addXs(builder, xsP);
  schema.VecTable.addYs(builder, ysP);
  return schema.VecTable.endVecTable(builder);
}

function createSBTable(builder: flatbuffers.Builder, bodies: BodiesType): flatbuffers.Offset {
  const bb_locs = createVecTable(builder, bodies.xs, bodies.ys);
  const bb_robotIDs = schema.SpawnedBodyTable.createRobotIDsVector(builder, bodies.robotIDs);
  const bb_teamIDs = schema.SpawnedBodyTable.createTeamIDsVector(builder, bodies.teamIDs);
  const bb_types = schema.SpawnedBodyTable.createTypesVector(builder, bodies.types);

  schema.SpawnedBodyTable.startSpawnedBodyTable(builder)
  schema.SpawnedBodyTable.addLocs(builder, bb_locs);
  schema.SpawnedBodyTable.addRobotIDs(builder, bb_robotIDs);
  schema.SpawnedBodyTable.addTeamIDs(builder, bb_teamIDs);
  schema.SpawnedBodyTable.addTypes(builder, bb_types);
  return schema.SpawnedBodyTable.endSpawnedBodyTable(builder);
}

function createMap(builder: flatbuffers.Builder, bodies: number, name: string, map?: MapType): flatbuffers.Offset {
  const bb_name = builder.createString(name);

  const dirt: number[] = (map ? map.dirt : new Array(SIZE*SIZE));
  const water: boolean[] = (map ? map.water : new Array(SIZE*SIZE));
  const poll: number[] = (map ? map.pollution : new Array(SIZE*SIZE));
  const soup: number[] = (map ? map.soup : new Array(SIZE*SIZE));

  // all values default to zero
  const bb_dirt = schema.GameMap.createDirtVector(builder, dirt);
  const bb_water = schema.GameMap.createWaterVector(builder, water);
  const bb_poll = schema.GameMap.createPollutionVector(builder, poll);
  const bb_soup = schema.GameMap.createSoupVector(builder, soup);

  schema.GameMap.startGameMap(builder);
  schema.GameMap.addName(builder, bb_name);

  schema.GameMap.addMinCorner(builder, schema.Vec.createVec(builder, 0, 0));
  schema.GameMap.addMaxCorner(builder, schema.Vec.createVec(builder, SIZE, SIZE));

  if(!isNull(bodies)) schema.GameMap.addBodies(builder, bodies);
  schema.GameMap.addRandomSeed(builder, 42);

  schema.GameMap.addDirt(builder, bb_dirt);
  schema.GameMap.addWater(builder, bb_water);
  schema.GameMap.addPollution(builder, bb_poll);
  schema.GameMap.addSoup(builder, bb_soup);
  schema.GameMap.addInitialWater(builder, 0);

  return schema.GameMap.endGameMap(builder);
}

function createGameHeader(builder: flatbuffers.Builder): flatbuffers.Offset {
  const bodies: flatbuffers.Offset[] = [];
  // what's the default value?
  // Is there any way to automate this?
  for (const body of bodyTypeList) {
    const btmd = schema.BodyTypeMetadata;
    btmd.startBodyTypeMetadata(builder);
    btmd.addType(builder, body);
    btmd.addSpawnSource(builder, body); // Real spawn source?
    btmd.addCost(builder, 100);
    btmd.addDirtLimit(builder, 10);
    btmd.addSoupLimit(builder, 100);
    btmd.addActionCooldown(builder, 10.0);
    btmd.addSensorRadiusSquared(builder, 3);
    btmd.addPollutionRadiusSquared(builder, 3);
    btmd.addLocalPollutionAdditiveEffect(builder, 1);
    btmd.addLocalPollutionMultiplicativeEffect(builder, 1);
    btmd.addMaxSoupProduced(builder, 0);
    btmd.addBytecodeLimit(builder, 1000);
    bodies.push(schema.BodyTypeMetadata.endBodyTypeMetadata(builder));
  }

  const teams: flatbuffers.Offset[] = [];
  for (let team of [1, 2]) {
    const name = builder.createString('Team '+team);
    const packageName = builder.createString('big'+team+'.memes.big.dreams');
    schema.TeamData.startTeamData(builder);
    schema.TeamData.addName(builder, name);
    schema.TeamData.addPackageName(builder, packageName);
    schema.TeamData.addTeamID(builder, team);
    teams.push(schema.TeamData.endTeamData(builder));
  }

  const version = builder.createString('IMAGINARY VERSION!!!');
  const bodiesPacked = schema.GameHeader.createBodyTypeMetadataVector(builder, bodies);
  const teamsPacked = schema.GameHeader.createTeamsVector(builder, teams);

  schema.GameHeader.startGameHeader(builder);
  schema.GameHeader.addSpecVersion(builder, version);
  schema.GameHeader.addBodyTypeMetadata(builder, bodiesPacked);
  schema.GameHeader.addTeams(builder, teamsPacked);
  return schema.GameHeader.endGameHeader(builder);
}

function createGameFooter(builder: flatbuffers.Builder, winner: number): flatbuffers.Offset {
  schema.GameFooter.startGameFooter(builder);
  schema.GameFooter.addWinner(builder, winner);
  return schema.GameFooter.endGameFooter(builder);
}

function createMatchHeader(builder: flatbuffers.Builder, turns: number, map: number): flatbuffers.Offset {
  schema.MatchHeader.startMatchHeader(builder);
  schema.MatchHeader.addMaxRounds(builder, turns);
  schema.MatchHeader.addMap(builder, map);

  return schema.MatchHeader.endMatchHeader(builder);
}

function createMatchFooter(builder: flatbuffers.Builder, turns: number, winner: number): flatbuffers.Offset {
  schema.MatchFooter.startMatchFooter(builder);
  schema.MatchFooter.addWinner(builder, winner);
  schema.MatchFooter.addTotalRounds(builder, turns);

  return schema.MatchFooter.endMatchFooter(builder);
}

function createGameWrapper(builder: flatbuffers.Builder, events: flatbuffers.Offset[], turns: number): flatbuffers.Offset {
  const eventsPacked = schema.GameWrapper.createEventsVector(builder, events);
  const matchHeaders = schema.GameWrapper.createMatchHeadersVector(builder, [1]);
  const matchFooters = schema.GameWrapper.createMatchFootersVector(builder, [turns+2]);
  schema.GameWrapper.startGameWrapper(builder)
  schema.GameWrapper.addEvents(builder, eventsPacked);
  schema.GameWrapper.addMatchHeaders(builder, matchHeaders);
  schema.GameWrapper.addMatchFooters(builder, matchFooters);
  return schema.GameWrapper.endGameWrapper(builder);
}

// Game without any unit & changes
function createBlankGame(turns: number) {
  let builder = new flatbuffers.Builder();
  let events: flatbuffers.Offset[] = [];

  events.push(createEventWrapper(builder, createGameHeader(builder), schema.Event.GameHeader));

  const map = createMap(builder, null, 'Blank Demo');
  events.push(createEventWrapper(builder, createMatchHeader(builder, turns, map), schema.Event.MatchHeader));

  for (let i = 1; i < turns+1; i++) {
    schema.Round.startRound(builder);
    schema.Round.addRoundID(builder, i);

    events.push(createEventWrapper(builder, schema.Round.endRound(builder), schema.Event.Round));
  }

  events.push(createEventWrapper(builder, createMatchFooter(builder, turns, 1), schema.Event.MatchFooter));
  events.push(createEventWrapper(builder, createGameFooter(builder, 1), schema.Event.GameFooter));

  const wrapper = createGameWrapper(builder, events, turns);
  builder.finish(wrapper);
  return builder.asUint8Array();
}

// Game with every units, without any changes
function createStandGame(turns: number) {
  let builder = new flatbuffers.Builder();
  let events: flatbuffers.Offset[] = [];

  events.push(createEventWrapper(builder, createGameHeader(builder), schema.Event.GameHeader));

  const unitCount = bodyVariety * 2;
  let robotIDs = new Array(unitCount);
  let teamIDs = new Array(unitCount);
  let types = new Array(unitCount);
  let xs = new Array(unitCount);
  let ys = new Array(unitCount);
  for (let i = 0; i < unitCount; i++) {
    robotIDs[i] = i;
    teamIDs[i] = i%2+1; // 1 2 1 2 1 2 ...

    let type = Math.floor(i/2);
    types[i] = bodyTypeList[type];

    // assume map is large enough
    xs[i] = Math.floor(i/2) * 2 + 5;
    ys[i] = 5*(i%2)+5;
  }

  const bb_locs = createVecTable(builder, xs, ys);
  const bb_robotIDs = schema.SpawnedBodyTable.createRobotIDsVector(builder, robotIDs);
  const bb_teamIDs = schema.SpawnedBodyTable.createTeamIDsVector(builder, teamIDs);
  const bb_types = schema.SpawnedBodyTable.createTypesVector(builder, types);
  schema.SpawnedBodyTable.startSpawnedBodyTable(builder)
  schema.SpawnedBodyTable.addLocs(builder, bb_locs);
  schema.SpawnedBodyTable.addRobotIDs(builder, bb_robotIDs);
  schema.SpawnedBodyTable.addTeamIDs(builder, bb_teamIDs);
  schema.SpawnedBodyTable.addTypes(builder, bb_types);
  const bodies = schema.SpawnedBodyTable.endSpawnedBodyTable(builder);

  const map = createMap(builder, bodies, "Stand Demo");
  events.push(createEventWrapper(builder, createMatchHeader(builder, turns, map), schema.Event.MatchHeader));

  for (let i = 1; i < turns+1; i++) {
    schema.Round.startRound(builder);
    schema.Round.addRoundID(builder, i);

    events.push(createEventWrapper(builder, schema.Round.endRound(builder), schema.Event.Round));
  }

  events.push(createEventWrapper(builder, createMatchFooter(builder, turns, 1), schema.Event.MatchFooter));
  events.push(createEventWrapper(builder, createGameFooter(builder, 1), schema.Event.GameFooter));

  const wrapper = createGameWrapper(builder, events, turns);
  builder.finish(wrapper);
  return builder.asUint8Array();
}

// Game with every units, and picking actions to make drones filled
function createPickGame(turns: number) {
  let builder = new flatbuffers.Builder();
  let events: flatbuffers.Offset[] = [];

  events.push(createEventWrapper(builder, createGameHeader(builder), schema.Event.GameHeader));

  const unitCount = bodyVariety * 2 + 2;
  let robotIDs = new Array(unitCount);
  let teamIDs = new Array(unitCount);
  let types = new Array(unitCount);
  let xs = new Array(unitCount);
  let ys = new Array(unitCount);

  // carrying drones in unitCount-2, unitCount-1
  for (let i = 0; i < unitCount; i++) {
    robotIDs[i] = i;
    teamIDs[i] = i%2+1; // 1 2 1 2 1 2 ...

    let type = Math.floor(i/2);
    if(type>=bodyVariety) type = schema.BodyType.DELIVERY_DRONE;
    else type = bodyTypeList[type];
    types[i] = type;

    // assume map is large enough
    xs[i] = Math.floor(i/2) * 2 + 5;
    ys[i] = 5*(i%2)+5;
  }

  const bb_locs = createVecTable(builder, xs, ys);
  const bb_robotIDs = schema.SpawnedBodyTable.createRobotIDsVector(builder, robotIDs);
  const bb_teamIDs = schema.SpawnedBodyTable.createTeamIDsVector(builder, teamIDs);
  const bb_types = schema.SpawnedBodyTable.createTypesVector(builder, types);
  schema.SpawnedBodyTable.startSpawnedBodyTable(builder)
  schema.SpawnedBodyTable.addLocs(builder, bb_locs);
  schema.SpawnedBodyTable.addRobotIDs(builder, bb_robotIDs);
  schema.SpawnedBodyTable.addTeamIDs(builder, bb_teamIDs);
  schema.SpawnedBodyTable.addTypes(builder, bb_types);
  const bodies = schema.SpawnedBodyTable.endSpawnedBodyTable(builder);

  const map = createMap(builder, bodies, "Pick Demo");
  events.push(createEventWrapper(builder, createMatchHeader(builder, turns, map), schema.Event.MatchHeader));

  for (let i = 1; i < turns+1; i++) {
    let bb_actionIDs: number, bb_actions: number, bb_actionTargets: number;
    if(i%5 == 0){ // pick up or drop
      const nowAction = (i%10 == 5 ? schema.Action.PICK_UNIT : schema.Action.DROP_UNIT);
      const actionIDs = [unitCount-2, unitCount-1]; // drones pick up
      const actions = [nowAction, nowAction];
      const actionTargets = [unitCount-4, unitCount-3]; // picking up none

      bb_actionIDs = schema.Round.createActionIDsVector(builder, actionIDs);
      bb_actions = schema.Round.createActionsVector(builder, actions);
      bb_actionTargets = schema.Round.createActionTargetsVector(builder, actionTargets);
    }

    schema.Round.startRound(builder);
    schema.Round.addRoundID(builder, i);

    if(i%5 == 0){
      schema.Round.addActionIDs(builder, bb_actionIDs);
      schema.Round.addActions(builder, bb_actions);
      schema.Round.addActionTargets(builder, bb_actionTargets);
    }

    events.push(createEventWrapper(builder, schema.Round.endRound(builder), schema.Event.Round));
  }

  events.push(createEventWrapper(builder, createMatchFooter(builder, turns, 1), schema.Event.MatchFooter));
  events.push(createEventWrapper(builder, createGameFooter(builder, 1), schema.Event.GameFooter));

  const wrapper = createGameWrapper(builder, events, turns);
  builder.finish(wrapper);
  return builder.asUint8Array();
}

// Game with spawning and dying random units
function createLifeGame(turns: number) {
  let builder = new flatbuffers.Builder();
  let events: flatbuffers.Offset[] = [];

  events.push(createEventWrapper(builder, createGameHeader(builder), schema.Event.GameHeader));

  const manager = new IDsManager(maxID);

  const bodies = createRandomBodies(manager, 10);
  const SBTable = createSBTable(builder, bodies);
  const map = createMap(builder, SBTable, "Life Demo");
  events.push(createEventWrapper(builder, createMatchHeader(builder, turns, map), schema.Event.MatchHeader));

  for (let i = 1; i < turns+1; i++) {

    const dieUnits = Math.min(2, maxID - manager.units());
    const spawnUnits = dieUnits;

    const diedIDs = new Array();
    for(let i=0; i<dieUnits; i++){
      const ID = manager.killRandomID();
      diedIDs.push(ID);
    }

    const bodies = createRandomBodies(manager, spawnUnits);

    const bb_diedIDs = schema.Round.createDiedIDsVector(builder, diedIDs);
    const bb_spawnedBodies = createSBTable(builder, bodies);

    schema.Round.startRound(builder);
    schema.Round.addRoundID(builder, i);

    schema.Round.addDiedIDs(builder, bb_diedIDs);
    schema.Round.addSpawnedBodies(builder, bb_spawnedBodies);

    events.push(createEventWrapper(builder, schema.Round.endRound(builder), schema.Event.Round));
  }

  events.push(createEventWrapper(builder, createMatchFooter(builder, turns, 1), schema.Event.MatchFooter));
  events.push(createEventWrapper(builder, createGameFooter(builder, 1), schema.Event.GameFooter));

  const wrapper = createGameWrapper(builder, events, turns);
  builder.finish(wrapper);
  return builder.asUint8Array();
}

// Game with every units, moving in random constant speed & direction
function createWanderGame(turns: number, unitCount: number) {
  let builder = new flatbuffers.Builder();
  let events: flatbuffers.Offset[] = [];

  events.push(createEventWrapper(builder, createGameHeader(builder), schema.Event.GameHeader));


  const manager = new IDsManager(maxID);

  const bodies = createRandomBodies(manager, unitCount);
  const SBTable = createSBTable(builder, bodies);
  const map = createMap(builder, SBTable, "Wander Demo");
  events.push(createEventWrapper(builder, createMatchHeader(builder, turns, map), schema.Event.MatchHeader));

  let velxs = new Array(unitCount);
  let velys = new Array(unitCount);
  for (let i = 0; i < unitCount; i++) {
    velxs[i] = random(-1, 1);
    velys[i] = random(-1, 1);
  }
  const xs = bodies.xs;
  const ys = bodies.ys;

  for (let i = 1; i < turns+1; i++) {
    for (let i = 0; i < unitCount; i++) {
      if(random(0, 32) === 0){
        velxs[i] = random(-1, 1);
        velys[i] = random(-1, 1);
      }
      xs[i] = trimEdge(xs[i] + velxs[i], 0, SIZE-1);
      ys[i] = trimEdge(ys[i] + velys[i], 0, SIZE-1);
      if(xs[i] === 0 || xs[i] == SIZE-1) velxs[i] = -velxs[i];
      if(ys[i] === 0 || ys[i] == SIZE-1) velys[i] = -velys[i];
    }
    const movedLocs = createVecTable(builder, xs, ys);

    const movedP = schema.Round.createMovedIDsVector(builder, bodies.robotIDs);

    schema.Round.startRound(builder);
    schema.Round.addRoundID(builder, i);

    schema.Round.addMovedLocs(builder, movedLocs);
    schema.Round.addMovedIDs(builder, movedP);

    events.push(createEventWrapper(builder, schema.Round.endRound(builder), schema.Event.Round));
  }

  events.push(createEventWrapper(builder, createMatchFooter(builder, turns, 1), schema.Event.MatchFooter));
  events.push(createEventWrapper(builder, createGameFooter(builder, 1), schema.Event.GameFooter));

  const wrapper = createGameWrapper(builder, events, turns);
  builder.finish(wrapper);
  return builder.asUint8Array();
}

function createWaterGame(turns: number) {

  let builder = new flatbuffers.Builder();
  let events: flatbuffers.Offset[] = [];

  events.push(createEventWrapper(builder, createGameHeader(builder), schema.Event.GameHeader));

  const map: MapType = {
    dirt: new Array(SIZE*SIZE),
    water: new Array(SIZE*SIZE),
    pollution: new Array(SIZE*SIZE),
    soup: new Array(SIZE*SIZE)
  };
  for(let i=0; i<SIZE; i++) for(let j=0; j<SIZE; j++){
    const idxVal = i*SIZE + j;
    map.dirt[idxVal] = random(0,50);
    map.water[idxVal] = random(0,3);
  }

  const bb_map = createMap(builder, null, 'Water Demo', map);
  events.push(createEventWrapper(builder, createMatchHeader(builder, turns, bb_map), schema.Event.MatchHeader));

  for (let i = 1; i < turns+1; i++) {
    schema.Round.startRound(builder);
    schema.Round.addRoundID(builder, i);

    events.push(createEventWrapper(builder, schema.Round.endRound(builder), schema.Event.Round));
  }

  events.push(createEventWrapper(builder, createMatchFooter(builder, turns, 1), schema.Event.MatchFooter));
  events.push(createEventWrapper(builder, createGameFooter(builder, 1), schema.Event.GameFooter));

  const wrapper = createGameWrapper(builder, events, turns);
  builder.finish(wrapper);
  return builder.asUint8Array();
}

function createViewOptionGame(turns: number) {
  let builder = new flatbuffers.Builder();
  let events: flatbuffers.Offset[] = [];

  events.push(createEventWrapper(builder, createGameHeader(builder), schema.Event.GameHeader));

  const map: MapType = {
    dirt: new Array(SIZE*SIZE),
    water: new Array(SIZE*SIZE),
    pollution: new Array(SIZE*SIZE),
    soup: new Array(SIZE*SIZE)
  };
  for(let i=0; i<SIZE; i++) for(let j=0; j<SIZE; j++){
    const idxVal = i*SIZE + j;
    map.dirt[idxVal] = random(-10,50);
    map.water[idxVal] = random(0, random(0,3));
    map.pollution[idxVal] = Math.max(random(-200, 500), 0);
  }

  const bb_map = createMap(builder, null, 'ViewOptions Demo', map);
  events.push(createEventWrapper(builder, createMatchHeader(builder, turns, bb_map), schema.Event.MatchHeader));

  for (let i = 1; i < turns+1; i++) {
    schema.Round.startRound(builder);
    schema.Round.addRoundID(builder, i);

    events.push(createEventWrapper(builder, schema.Round.endRound(builder), schema.Event.Round));
  }

  events.push(createEventWrapper(builder, createMatchFooter(builder, turns, 1), schema.Event.MatchFooter));
  events.push(createEventWrapper(builder, createGameFooter(builder, 1), schema.Event.GameFooter));

  const wrapper = createGameWrapper(builder, events, turns);
  builder.finish(wrapper);
  return builder.asUint8Array();
}

function createSoupGame(turns: number) {
  let builder = new flatbuffers.Builder();
  let events: flatbuffers.Offset[] = [];

  events.push(createEventWrapper(builder, createGameHeader(builder), schema.Event.GameHeader));

  const map: MapType = {
    dirt: new Array(SIZE*SIZE),
    water: new Array(SIZE*SIZE),
    pollution: new Array(SIZE*SIZE),
    soup: new Array(SIZE*SIZE)
  };
  for(let i=0; i<SIZE; i++) for(let j=0; j<SIZE; j++){
    const idxVal = i*SIZE + j;
    map.dirt[idxVal] = random(-3,10);
    map.water[idxVal] = random(0, random(0,2));
    map.pollution[idxVal] = Math.max(random(-200, 500), 0);
    map.soup[idxVal] = random(0, random(0, 3)) * 47;
  }

  const bb_map = createMap(builder, null, 'Soup Demo', map);
  events.push(createEventWrapper(builder, createMatchHeader(builder, turns, bb_map), schema.Event.MatchHeader));

  for (let i = 1; i < turns+1; i++) {
    schema.Round.startRound(builder);
    schema.Round.addRoundID(builder, i);

    events.push(createEventWrapper(builder, schema.Round.endRound(builder), schema.Event.Round));
  }

  events.push(createEventWrapper(builder, createMatchFooter(builder, turns, 1), schema.Event.MatchFooter));
  events.push(createEventWrapper(builder, createGameFooter(builder, 1), schema.Event.GameFooter));

  const wrapper = createGameWrapper(builder, events, turns);
  builder.finish(wrapper);
  return builder.asUint8Array();
}

function main(){
  const games = [
    { name: "blank", game: createBlankGame(512)},
    { name: "stand", game: createStandGame(1024) },
    { name: "pick", game: createPickGame(1024) },
    { name: "wander", game: createWanderGame(2048, 32) },
    { name: "life", game: createLifeGame(512) },
    { name: "water", game: createWaterGame(512) }, 
    { name: "soup", game: createSoupGame(512) }, 
    { name: "viewOptions", game: createViewOptionGame(512) }
  ];
  SIZE = 64;
  games.push({ name: "big-wander", game: createWanderGame(2048, 128) });
  SIZE = 32;
  
  const prefix = "../examples/";

  games.forEach(pair => {
    const filename = `${prefix}${pair.name}.bc20`
    const stream = createWriteStream(filename);
    const game = pair.game;

    console.log(`Writing file to ${filename} ...`);

    if(!game){
      console.log(`Error making ${pair.name}!!`);
    }
    else{
      stream.write(Buffer.from(gzip(game)));
      console.log(`Generated ${pair.name} successfully!\n`)
    }
  });
  console.log(`Finished generating files!`);
}

main();

export {createGameHeader, createEventWrapper};
