import * as cst from '../../constants';

import {MapUnit} from '../index';

export enum Symmetry {
  ROTATIONAL,
  HORIZONTAL,
  VERTICAL
};
export default class SymmetryForm {

  // The public div
  readonly div: HTMLDivElement;

  // HTML elements
  private select: HTMLSelectElement;

  // Callback on input change to redraw the canvas
  private cb: () => void;

  // Constants. TODO: make these and assosciated methods static
  private readonly SYMMETRY_OPTIONS: Symmetry[] = [
    Symmetry.ROTATIONAL, Symmetry.HORIZONTAL, Symmetry.VERTICAL
  ];

  constructor(cb: () => void) {

    // Store the callback
    this.cb = cb;

    // Create the HTML elements
    this.div = document.createElement("div");
    this.select = document.createElement("select");

    // Create the form
    this.loadInputs();
    this.div.appendChild(this.createForm());
    this.loadCallbacks();
  }

  /**
   * Initializes input fields
   */
  private loadInputs(): void {
    this.SYMMETRY_OPTIONS.forEach((option: Symmetry) => {
      let opt = document.createElement("option");
      opt.value = String(option);
      opt.appendChild(document.createTextNode(cst.symmetryToString(option)));
      this.select.appendChild(opt);
    });
  }

  /**
   * Creates the form that selects symmetry.
   */
  private createForm(): HTMLFormElement {
    const form = document.createElement("form");
    form.style.textAlign = 'left';
    form.appendChild(document.createTextNode("Symmetry: "));
    form.appendChild(this.select);
    return form;
  }

  /**
   * Add callbacks to the form elements
   */
  private loadCallbacks(): void {
    this.select.onchange = () => {
      // Rerender the canvas
      this.cb();
    }
  }

  /**
   * The symmetry of the map currently selected
   */
  getSymmetry(): Symmetry {
    return parseInt(this.select.options[this.select.selectedIndex].value);
  }

  setSymmetry(symmetry) {
    this.select.value = symmetry;
  }

    // Whether or not loc lies on the point or line of symmetry
  private onSymmetricLine(x, y, width: number, height: number): boolean {
    const midX = width / 2 - 0.5;
    const midY = height / 2 - 0.5;
    switch(this.getSymmetry()) {
      case(Symmetry.ROTATIONAL):
      return x === midX && y === midY;
      case(Symmetry.HORIZONTAL):
      return y === midY;
      case(Symmetry.VERTICAL):
      return x === midX;
    }
  };

  flipTeamID(teamID: number) {
    return teamID === 0 ? 0 : 3 - teamID;
  }

  // Returns the symmetric location on the canvas
  transformLoc (x, y, width: number, height: number) {
    return this.transformLocStatic(x, y, width, height, this.getSymmetry());
  };

  // TODO: make this actually static!
  transformLocStatic(x, y, width, height, symmetry: Symmetry) {
    function reflect(x: number, mid: number): number {
      if (x > mid) {
        return mid - Math.abs(x - mid);
      } else {
        return mid + Math.abs(x - mid);
      }
    }

    const midX = width / 2 - 0.5;
    const midY = height / 2 - 0.5;
    switch(symmetry) {
      case(Symmetry.ROTATIONAL):
      return {x: reflect(x, midX), y: reflect(y, midY)};
      case(Symmetry.HORIZONTAL):
      return {x: x, y: reflect(y, midY)};
      case(Symmetry.VERTICAL):
      return {x: reflect(x, midX), y: y};
    }
  }

  /**
   * Uses the bodies stored internally to create a mapping of original body
   * IDs to the symmetric unit. A symmetric unit is a unit with the same ID
   * that is reflected or rotated around a line or point of symmetry based on
   * the parameter given in the map editor form.
   */
  getSymmetricBodies(bodies: Map<number, MapUnit>, width: number, height: number):  Map<number, MapUnit> {
    // no symmetric (neutral) body in 2021 game

    const symmetricBodies: Map<number, MapUnit> = new Map<number, MapUnit>();
    bodies.forEach((body: MapUnit, id: number) => {
      if (!this.onSymmetricLine(body.x, body.y, width, height)) {
        const type = body.type;
        const teamID = body.teamID === undefined? 0 : body.teamID;
        const newLoc = this.transformLoc(body.x, body.y, width, height);
        symmetricBodies.set(id, {
          x: newLoc.x,
          y: newLoc.y,
          radius: body.radius,
          type: type,
          teamID: this.flipTeamID(teamID),
          influence: body.influence
        });
      }
    });

    return symmetricBodies;
  }

  /**
   * Given a list of units and passability, finds a compatible symmetry.
   */
  discoverSymmetryAndBodies(mapUnits: MapUnit[], passability: number[], width: number, height: number): {symmetry: Symmetry, originalBodies: Map<number, MapUnit>} | null {
    for (const symmetry of this.SYMMETRY_OPTIONS) {

      var possible: boolean = true;
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const newLoc = this.transformLocStatic(x, y, width, height, symmetry);
          if (passability[y * width + x] !== passability[newLoc.y * width + newLoc.x]) {
            possible = false;
          }
        }
      }
      
      const originalBodies = new Map<number, MapUnit>();
      const matched = new Array(originalBodies.size);
      var id = 1;
      for (let i = 0; i < mapUnits.length; i++) {
        if (matched[i]) continue;
        const unit1 = mapUnits[i];
        const newLoc = this.transformLocStatic(unit1.x, unit1.y, width, height, symmetry);
        for (let j = i; j < mapUnits.length; j++) {
          const unit2 = mapUnits[j];
          if (unit2.x == newLoc.x && unit2.y == newLoc.y) {
            originalBodies.set(id++, unit1);
            matched[i] = matched[j] = true;
          }
        }
      }
      if (possible) return {symmetry: symmetry, originalBodies: originalBodies}
    }
    return null;
  }
}
