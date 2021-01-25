import * as cst from '../../constants';

import { schema, flatbuffers } from 'battlecode-playback';
import { MapUnit, GameMap } from '../index';

// Bodies information
type BodiesSchema = {
  robotIDs: number[],
  teamIDs: number[],
  types: schema.BodyType[],
  xs: number[],
  ys: number[],
  influences: number[]
};

export type UploadedMap = {
  name: string,
  width: number,
  height: number,
  passability: number[],
  bodies: MapUnit[]
}

/**
 * Generates a .map21 file from a GameMap. Assumes the given GameMap represents
 * a valid game map.
 */
export default class MapGenerator {

  private static bodiesArray: BodiesSchema;
  // private static treesArray: TreesSchema

  /**
   * Combines two maps of IDs to bodies into one map, assigning a unique ID
   * to each body in the new map.
   */
  private static combineBodies(bodiesA: Map<number, MapUnit>, bodiesB: Map<number, MapUnit>): Map<number, MapUnit> {

    const bodies = new Map<number, MapUnit>();
    const offsetA = Math.round(Math.random()); // 0 or 1
    const offsetB = 1 - offsetA; // 1 or 0

    bodiesA.forEach((body: MapUnit, id: number) => {
      bodies.set(id * 2 + offsetA, body);
    });
    bodiesB.forEach((body: MapUnit, id: number) => {
      bodies.set(id * 2 + offsetB, body);
    });

    return bodies;
  }

  private static createVecTable(builder: flatbuffers.Builder, xs: number[], ys: number[]) {
    const xsP = schema.VecTable.createXsVector(builder, xs);
    const ysP = schema.VecTable.createYsVector(builder, ys);
    schema.VecTable.startVecTable(builder);
    schema.VecTable.addXs(builder, xsP);
    schema.VecTable.addYs(builder, ysP);
    return schema.VecTable.endVecTable(builder);
  }

  /**
   * Adds a robot body to the internal array
   */
  private static addBody(robotID: number, teamID: number, type: schema.BodyType, x: number, y: number, influence: number) {
    this.bodiesArray.robotIDs.push(robotID); // ignored by engine
    this.bodiesArray.teamIDs.push(teamID);
    this.bodiesArray.types.push(type);
    this.bodiesArray.xs.push(x);
    this.bodiesArray.ys.push(y);
    this.bodiesArray.influences.push(influence);
  }

  /**
   * Adds multiple bodies to the internal array with the given teamID.
   */
  private static addBodies(bodies: Map<number, MapUnit>, minCornerX, minCornerY) {

    bodies.forEach((unit: MapUnit, id: number) => {
      this.addBody(
        id,
        unit.teamID || 0, // Must be set if not a neutral tree
        unit.type,
        unit.x,
        unit.y,
        unit.influence
      );
    });
  }

  /**
   * Write fields to a schema.GameMap and write the game map out to a file
   */
  static generateMap(map: GameMap): Uint8Array | undefined {
    const builder = new flatbuffers.Builder();

    // Spawned body information
    this.bodiesArray = {
      robotIDs: [],
      teamIDs: [],
      types: [],
      xs: [],
      ys: [],
      influences: []
    };

    // Get header information from form
    let name: string = map.name;
    const minCornerX = Math.random() * 20000 + 10000;
    const minCornerY = Math.random() * 20000 + 10000;
    let maxCornerX = minCornerX + map.width;
    let maxCornerY = minCornerY + map.height;
    let randomSeed: number = Math.round(Math.random() * 1000);

    // Get body information from form and convert to arrays
    this.addBodies(this.combineBodies(map.originalBodies, map.symmetricBodies), minCornerX, minCornerY);

    // Create the spawned bodies table
    let robotIDsVectorB = schema.SpawnedBodyTable.createRobotIDsVector(builder, this.bodiesArray.robotIDs);
    let teamIDsVectorB = schema.SpawnedBodyTable.createTeamIDsVector(builder, this.bodiesArray.teamIDs);
    let typesVectorB = schema.SpawnedBodyTable.createTypesVector(builder, this.bodiesArray.types);
    let locsVecTableB = this.createVecTable(builder, this.bodiesArray.xs, this.bodiesArray.ys);
    let influencesVectorB = schema.SpawnedBodyTable.createInfluencesVector(builder, this.bodiesArray.influences);
    schema.SpawnedBodyTable.startSpawnedBodyTable(builder)
    schema.SpawnedBodyTable.addRobotIDs(builder, robotIDsVectorB);
    schema.SpawnedBodyTable.addTeamIDs(builder, teamIDsVectorB);
    schema.SpawnedBodyTable.addTypes(builder, typesVectorB);
    schema.SpawnedBodyTable.addLocs(builder, locsVecTableB);
    schema.SpawnedBodyTable.addInfluences(builder, influencesVectorB);
    const bodies = schema.SpawnedBodyTable.endSpawnedBodyTable(builder);

    const passability = schema.GameMap.createPassabilityVector(builder, map.passability);

    // Create the game map
    let nameP = builder.createString(name);
    schema.GameMap.startGameMap(builder);
    schema.GameMap.addName(builder, nameP);
    schema.GameMap.addMinCorner(builder, schema.Vec.createVec(builder, minCornerX, minCornerY));
    schema.GameMap.addMaxCorner(builder, schema.Vec.createVec(builder, maxCornerX, maxCornerY));
    schema.GameMap.addBodies(builder, bodies);
    schema.GameMap.addPassability(builder, passability);
    schema.GameMap.addRandomSeed(builder, randomSeed);
    const gameMap = schema.GameMap.endGameMap(builder);

    // Return the game map to write to a file
    builder.finish(gameMap);
    return builder.asUint8Array();
  }

  /**
   * When there isn't a scaffold, let the user download the file
   */
  static exportFile(data: Uint8Array, fileName: string) {
    let mimeType = "application/octet-stream";

    if (data != undefined) {
      let blob = new Blob([data], { type: mimeType });
      let url = window.URL.createObjectURL(blob);

      // Create phantom link
      let link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.style.display = "none";
      link.click();
      link.remove();

      setTimeout(function () {
        return window.URL.revokeObjectURL(url);
      }, 30000);
    }
  }

  /**
   * Reads a .map21 file.
   */
  static readMap(file: ArrayBuffer): UploadedMap {
    const data = new Uint8Array(file);
    const map = schema.GameMap.getRootAsGameMap(
      new flatbuffers.ByteBuffer(data)
    );
    const minCorner = map.minCorner()!;
    const maxCorner = map.maxCorner()!;

    const bodies = map.bodies()!;
    const influences = bodies.influencesArray()!;
    const types = bodies.typesArray()!;
    const teamIDs = bodies.teamIDsArray()!;
    const xs = bodies.locs()!.xsArray()!;
    const ys = bodies.locs()!.ysArray()!;

    const mapUnits: MapUnit[] = [];
    for (let i = 0; i < bodies.robotIDsLength(); i++) {
      mapUnits.push({
        x: xs[i],
        y: ys[i],
        type: types[i],
        teamID: teamIDs[i],
        influence: influences[i],
        radius: 0.5
      });
    }
    return {
      name: map.name()!,
      width: maxCorner.x() - minCorner.x(),
      height: maxCorner.y() - minCorner.y(),
      passability: Array.from(map.passabilityArray()!),
      bodies: mapUnits
    };
  }
}