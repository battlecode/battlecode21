import * as cst from '../../constants';

import Victor = require('victor');

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

  // Constants
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
    this.select.options[this.select.selectedIndex].value = symmetry;
  }

    // Whether or not loc lies on the point or line of symmetry
  private onSymmetricLine(loc: Victor, width: number, height: number): boolean {
    const midX = width / 2 - 0.5;
    const midY = height / 2 - 0.5;
    switch(this.getSymmetry()) {
      case(Symmetry.ROTATIONAL):
      return loc.x === midX && loc.y === midY;
      case(Symmetry.HORIZONTAL):
      return loc.y === midY;
      case(Symmetry.VERTICAL):
      return loc.x === midX;
    }
  };

  flipTeamID(teamID: number) {
    return teamID === 0 ? 0 : 3 - teamID;
  }

  // Returns the symmetric location on the canvas
  transformLoc (loc: Victor, width: number, height: number): Victor {
    function reflect(x: number, mid: number): number {
      if (x > mid) {
        return mid - Math.abs(x - mid);
      } else {
        return mid + Math.abs(x - mid);
      }
    }

    const midX = width / 2 - 0.5;
    const midY = height / 2 - 0.5;
    switch(this.getSymmetry()) {
      case(Symmetry.ROTATIONAL):
      return new Victor(reflect(loc.x, midX), reflect(loc.y, midY));
      case(Symmetry.HORIZONTAL):
      return new Victor(loc.x, reflect(loc.y, midY));
      case(Symmetry.VERTICAL):
      return new Victor(reflect(loc.x, midX), loc.y);
    }
  };

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
      if (!this.onSymmetricLine(body.loc, width, height)) {
        const type = body.type;
        const teamID = body.teamID === undefined? 0 : body.teamID;
        symmetricBodies.set(id, {
          loc: this.transformLoc(body.loc, width, height),
          radius: body.radius,
          type: type,
          teamID: this.flipTeamID(teamID),
          influence: body.influence
        });
      }
    });

    return symmetricBodies;
  }
}
