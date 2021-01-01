import * as cst from '../../constants';

import {schema, flatbuffers} from 'battlecode-playback';
import Victor = require('victor');

import {MapUnit, GameMap} from '../index';

// Bodies information
export type BodiesSchema = {
  robotIDs: number[],
  teamIDs: number[],
  types: schema.BodyType[],
  xs: number[],
  ys: number[]
};

// Neutral tree information
// export type TreesSchema = {
//   robotIDs: number[],
//   xs: number[],
//   ys: number[],
//   radii: number[],
//   containedBullets: number[],
//   containedBodies: schema.BodyType[]
// };

/**
 * Generates a .map17 file from a GameMap. Assumes the given GameMap represents
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
  private static addBody(robotID: number, teamID: number, type: schema.BodyType, x: number, y: number) {
    this.bodiesArray.robotIDs.push(robotID);
    this.bodiesArray.teamIDs.push(teamID);
    this.bodiesArray.types.push(type);
    this.bodiesArray.xs.push(x);
    this.bodiesArray.ys.push(y);
  }

  /**
   * Adds multiple bodies to the internal array with the given teamID.
   */
  private static addBodies(bodies: Map<number, MapUnit>, minCorner: Victor) {

    bodies.forEach((unit: MapUnit, id: number) => {
      this.addBody(
        id,
        unit.teamID || 0, // Must be set if not a neutral tree
        unit.type,
        unit.loc.x + minCorner.x,
        unit.loc.y + minCorner.y
      );
    });
  }

  /**
   * Adds a tree to the internal array
   */
  // private static addTree(robotID: number, x: number, y: number, radius: number,
  //   containedBullets: number, containedBody: schema.BodyType) {
  //   this.treesArray.robotIDs.push(robotID);
  //   this.treesArray.xs.push(x);
  //   this.treesArray.ys.push(y);
  //   this.treesArray.radii.push(radius);
  //   this.treesArray.containedBullets.push(containedBullets);
  //   this.treesArray.containedBodies.push(containedBody);
  // }

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
      ys: []
    };

    // Neutral tree information
    // this.treesArray = {
    //   robotIDs: [],
    //   xs: [],
    //   ys: [],
    //   radii: [],
    //   containedBullets: [],
    //   containedBodies: []
    // };

    // Get header information from form
    let name: string = map.name;
    let minCorner: Victor = new Victor(Math.random()*500, Math.random()*500);
    let maxCorner: Victor = minCorner.clone();
    maxCorner.add(new Victor(map.width, map.height));
    let randomSeed: number = Math.round(Math.random()*1000);

    // Get body information from form and convert to arrays
    this.addBodies(this.combineBodies(map.originalBodies, map.symmetricBodies), minCorner);

    // Create the spawned bodies table
    let robotIDsVectorB = schema.SpawnedBodyTable.createRobotIDsVector(builder, this.bodiesArray.robotIDs);
    let teamIDsVectorB = schema.SpawnedBodyTable.createTeamIDsVector(builder, this.bodiesArray.teamIDs);
    let typesVectorB = schema.SpawnedBodyTable.createTypesVector(builder, this.bodiesArray.types)
    let locsVecTableB = this.createVecTable(builder, this.bodiesArray.xs, this.bodiesArray.ys);
    schema.SpawnedBodyTable.startSpawnedBodyTable(builder)
    schema.SpawnedBodyTable.addRobotIDs(builder, robotIDsVectorB);
    schema.SpawnedBodyTable.addTeamIDs(builder, teamIDsVectorB);
    schema.SpawnedBodyTable.addTypes(builder, typesVectorB);
    schema.SpawnedBodyTable.addLocs(builder, locsVecTableB);
    const bodies = schema.SpawnedBodyTable.endSpawnedBodyTable(builder);

    // Create the neutral trees table
    // let robotIDsVectorT = schema.NeutralTreeTable.createRobotIDsVector(builder, this.treesArray.robotIDs);
    // let locsVecTableT = this.createVecTable(builder, this.treesArray.xs, this.treesArray.ys);
    // let radiiVectorT = schema.NeutralTreeTable.createRadiiVector(builder, this.treesArray.radii);
    // let containedBulletsVectorT = schema.NeutralTreeTable.createContainedBulletsVector(builder, this.treesArray.containedBullets);
    // let containedBodiesVectorT = schema.NeutralTreeTable.createContainedBodiesVector(builder, this.treesArray.containedBodies);
    // schema.NeutralTreeTable.startNeutralTreeTable(builder)
    // schema.NeutralTreeTable.addRobotIDs(builder, robotIDsVectorT);
    // schema.NeutralTreeTable.addLocs(builder, locsVecTableT);
    // schema.NeutralTreeTable.addRadii(builder, radiiVectorT);
    // schema.NeutralTreeTable.addContainedBullets(builder, containedBulletsVectorT);
    // schema.NeutralTreeTable.addContainedBodies(builder, containedBodiesVectorT);
    // const trees = schema.NeutralTreeTable.endNeutralTreeTable(builder);

    // Create the game map
    let nameP = builder.createString(name);
    schema.GameMap.startGameMap(builder);
    schema.GameMap.addName(builder, nameP);
    schema.GameMap.addMinCorner(builder, schema.Vec.createVec(builder, minCorner.x, minCorner.y));
    schema.GameMap.addMaxCorner(builder, schema.Vec.createVec(builder, maxCorner.x, maxCorner.y));
    schema.GameMap.addBodies(builder, bodies);
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

      setTimeout(function() {
        return window.URL.revokeObjectURL(url);
      }, 30000);
    }
  }
}