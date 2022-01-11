import * as cst from '../../constants';

import {GameMap, MapUnit} from '../index';

/**
 * Validates a map created by the map editor. If a map is valid, then the map
 * editor is ready to generate the .map21 file.
 *
 * In a valid map:
 * - No units overlap
 * - No units are off the map
 *
 * Additionally, in a valid starting map:
 * - There are 1 to 3 enlightenment centers
 * - There are no other units than enlightenment centers
 */
export default class MapValidator {

  /**
   * Validates the given map and alerts the user of what changes need to be made
   * to create a valid map.
   *
   * @param map the map the validate
   * @return whether or not the given map is a valid map
   */
  static isValid(map: GameMap): boolean {
    let errors = new Array();

    // Map must not have the same name as a server map
    if (Array.from(cst.SERVER_MAPS.keys()).includes(map.name)) {
      errors.push(`The map cannot have the same name as a server map!`);
    }

    // Bodies must be on the map
    // Invariant: bodies in originalBodies don't overlap with each other, and
    //            bodies in symmetricBodies don't overlap with each other
    map.originalBodies.forEach((unit: MapUnit, id: number) => {
      let x = unit.x;
      let y = unit.y;
      if (x < 0 || y < 0 || x > map.width || y > map.height) {
        errors.push(`ID ${id} is off the map.`);
      }
    });

    // Bodies must not overlap
    map.originalBodies.forEach((unitA: MapUnit, idA: number) => {
      map.symmetricBodies.forEach((unitB: MapUnit, idB: number) => {
        if (unitA.x === unitB.x && unitA.y === unitB.y) {
          errors.push (`IDs ${idA} and ${idB} are overlapping.`);
        }
      });
    });

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return false;
    }

    // It's good :)
    return true;
  }

  /**
   * Removes units from the map to create a valid map, and alerts the user of
   * the changes made.
   *
   * @param map the map to modify
   * @param cb a callback to render the canvas representing this map
   */
  static removeInvalidUnits(map: GameMap, cb: () => void): void {
    // NOTE: All changes that are made to originalBodies should be reflected in
    // symmetricBodies after the callback
    let actions = new Array();

    // Remove bodies that are off the map
    map.originalBodies.forEach((unit: MapUnit, id: number) => {
      let x = unit.x;
      let y = unit.y;
      let distanceToWall = Math.min(x, y, map.width - x, map.height - y);
      if (unit.radius > distanceToWall || x < 0 || y < 0 || x > map.width || y > map.height) {
        map.originalBodies.delete(id);
        actions.push(`Removed ID ${id}. (off the map)`);
      }
    });

    // Remove bodies that overlap
    // Invariant: bodies in originalBodies don't overlap with each other, and
    //            bodies in symmetricBodies don't overlap with each other
    map.originalBodies.forEach((unitA: MapUnit, idA: number) => {
      map.symmetricBodies.forEach((unitB: MapUnit, idB: number) => {
        // no radii this year
        // if (unitA.loc.distance(unitB.loc) <= unitA.radius + unitB.radius) { 
        if (unitA.x === unitB.x && unitA.y === unitB.y) {
          map.originalBodies.delete(idA);
          map.originalBodies.delete(idB);
          actions.push (`Removed IDs ${idA} and ${idB}. (overlapping)`);
        }
      });
    });

    // Remove the body from neutral trees with a smaller radius than the contained body
    // map.originalBodies.forEach((unit: MapUnit, id: number) => {
    //   if (unit.type === cst.TREE_NEUTRAL) {
    //     const treeRadius = unit.radius;
    //     const bodyRadius = cst.radiusFromBodyType(unit.containedBody);
    //     if (treeRadius < bodyRadius) {
    //       // TODO: figure out if this can be null???
    //       if (map.originalBodies.get(id) == null) {
    //         throw new Error('map.originalBodies is null????');
    //       }
    //       map.originalBodies.get(id)!.containedBody = cst.NONE;
    //       actions.push(`Removed a body from tree ID ${id}`);
    //     }
    //   }
    // });

    if (actions.length > 0) {
      alert(actions.join("\n"));
      cb();
    } else {
      alert("Congratulations, the map is already valid!");
    }
  }
}
