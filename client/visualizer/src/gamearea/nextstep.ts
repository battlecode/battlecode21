import {StructOfArrays, Metadata, GameWorld, schema} from 'battlecode-playback';

export type NextStepSchema = {
  id: Int32Array,
  x: Int32Array,
  y: Int32Array
}

/**
 * For interpolated rendering.
 */
export default class NextStep {
  /**
   * {
   *   id: Int32Array,
   *   x: Int32Array,
   *   y: Int32Array
   * }
   */
  bodies: StructOfArrays<NextStepSchema>;

  // Cache fields
  private _vecTableSlot: schema.VecTable;

  constructor() {
    this.bodies = new StructOfArrays({
      id: new Int32Array(0),
      x: new Int32Array(0),
      y: new Int32Array(0)
    }, 'id');
    this._vecTableSlot = new schema.VecTable();
  }

  /**
   * Load where robots will be in the next time step,
   * so that we can smoothly transition between steps.
   */
  loadNextStep(world: GameWorld, delta: schema.Round) {
    this.bodies.copyFrom(world.bodies);
    if (delta.roundID() != world.turn + 1) {
      throw new Error(`Bad Round [lerp]: world.turn = ${world.turn}, round.roundID() = ${delta.roundID()}`);
    }

    const movedLocs = delta.movedLocs(this._vecTableSlot);
    if(delta!==null && movedLocs!==null){
      this.bodies.alterBulk({
        id: <Int32Array>delta.movedIDsArray(),
        x: <Int32Array>movedLocs.xsArray(),
        y: <Int32Array>movedLocs.ysArray()
      });
    }
  }
}
