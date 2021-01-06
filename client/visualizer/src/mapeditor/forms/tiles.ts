import * as cst from '../../constants';

import {schema} from 'battlecode-playback';
import Victor = require('victor');

import {MapUnit} from '../index';

export default class TileForm {

  // The public div
  readonly div: HTMLDivElement;

  // Form elements for archon settings
  readonly x1: HTMLInputElement;
  readonly y1: HTMLInputElement;
  readonly x2: HTMLInputElement;
  readonly y2: HTMLInputElement;
  readonly pass: HTMLInputElement;
  readonly whichCornerDiv: HTMLSpanElement;

  // Selecting (x1, y1) or (x2, y2)?
  private whichCorner: number = 1;
  private readonly bottomLeftTip = "Select bottom-left corner";
  private readonly topRightTip = "Select top-right corner";

  // Callbacks on input change
  readonly width: () => number;
  readonly height: () => number;
  readonly maxRadius: (x: number, y: number, ignoreID?: number) => number;

  constructor(width: () => number, height: () => number,
    maxRadius: (x: number, y: number, ignoreID?: number) => number) {

    // Store the callbacks
    this.width = width;
    this.height = height;
    this.maxRadius = maxRadius;

    // Create HTML elements
    this.div = document.createElement("div");
    this.x1 = document.createElement("input");
    this.y1 = document.createElement("input");
    this.x2 = document.createElement("input");
    this.y2 = document.createElement("input");
    this.pass = document.createElement("input");
    this.whichCornerDiv = document.createElement("div");
    this.whichCornerDiv.textContent = this.bottomLeftTip;
    this.whichCornerDiv.style.color = "red";

    // Create the form
    this.loadInputs();
    this.div.appendChild(this.createForm());
    this.loadCallbacks();
  }

  /**
   * Initializes input fields.
   */
  private loadInputs(): void {
    this.x1.type = "text";
    this.y1.type = "text";
  }

  /**
   * Creates the HTML form that collects archon information.
   */
  private createForm(): HTMLFormElement {
    // HTML structure
    const form: HTMLFormElement = document.createElement("form");
    form.id = "change-tiles";
    const xy1: HTMLDivElement = document.createElement("div");
    const x1: HTMLSpanElement = document.createElement("span");
    const y1: HTMLSpanElement = document.createElement("span");
    const xy2: HTMLDivElement = document.createElement("div");
    const x2: HTMLSpanElement = document.createElement("span");
    const y2: HTMLSpanElement = document.createElement("span");
    const pass: HTMLSpanElement = document.createElement("span");
    form.appendChild(this.whichCornerDiv);
    form.appendChild(xy1);
    form.appendChild(xy2);
    form.appendChild(pass);
    form.appendChild(document.createElement("br"));

    // X1 coordinate
    x1.appendChild(document.createTextNode("X1:"));
    x1.appendChild(this.x1);

    // Y1 coordinate
    y1.appendChild(document.createTextNode("Y1:"));
    y1.appendChild(this.y1);

    // X1, Y1
    xy1.appendChild(x1);
    xy1.appendChild(y1);

    // X2 coordinate
    x2.appendChild(document.createTextNode("X2:"));
    x2.appendChild(this.x2);

    // Y2 coordinate
    y2.appendChild(document.createTextNode("Y2:"));
    y2.appendChild(this.y2);

    // X2, Y2
    xy2.appendChild(x2);
    xy2.appendChild(y2);

    pass.appendChild(document.createTextNode("Passability:"));
    pass.appendChild(this.pass);  

    return form;
  }

  /**
   * Add callbacks to the form elements.
   */
  private loadCallbacks(): void {

    // x1 must be in the range [0, this.width]
    this.x1.onchange = () => {
      this.x1.value = this.validate(this.getX1(), 0, this.width());
    };

    // y1 must be in the range [0, this.height]
    this.y1.onchange = () => {
      this.y1.value = this.validate(this.getY1(), 0, this.height());
    };

    // x2 must be in the range [x1, this.width]
    this.x2.onchange = () => {
      this.x2.value = !isNaN(this.getX2()) ? this.validate(this.getX2(), this.getX1(), this.width()) : "";
    };

    // y2 must be in the range [y1, this.height]
    this.y2.onchange = () => {
      this.y2.value = !isNaN(this.getY2()) ? this.validate(this.getY2(), this.getY1(), this.height()) : "";
    };

    this.pass.onchange = () => {
      this.pass.value = !isNaN(this.getPass()) ? this.validate(this.getPass(), 0.1, 1) : "";
    };
  }

  getX1(): number {
    return parseInt(this.x1.value);
  }

  getY1(): number {
    return parseInt(this.y1.value);
  }

  getX2(): number {
    return parseInt(this.x2.value);
  }

  getY2(): number {
    return parseInt(this.y2.value);
  }

  getPass(): number {
    return parseFloat(this.pass.value);
  }

  resetForm(): void {
    this.x1.value = "";
    this.y1.value = "";
    this.x2.value = "";
    this.y2.value = "";
    this.pass.value = "";
  }

  setForm(loc: Victor): void {
    if (this.whichCorner == 1) {
      this.x1.value = this.validate(loc.x);
      this.y1.value = this.validate(loc.y);
      this.whichCorner = 2;
      this.whichCornerDiv.textContent = this.topRightTip;
    }
    else {
      this.x2.value = this.validate(loc.x, this.getX1());
      this.y2.value = this.validate(loc.y, this.getY1());
      this.whichCorner = 1;
      this.whichCornerDiv.textContent = this.bottomLeftTip;
    }
  }

  validate (value: number, min: number = 0, max: number = Infinity) {
    value = Math.max(value, min);
    value = Math.min(value, max);
    return isNaN(value) ? "" : String(value);
  }

  // setForm(loc: Victor, body?: MapUnit, id?: number): void {
  //   this.x.value = String(loc.x);
  //   this.y.value = String(loc.y);
  //   this.id.textContent = id === undefined ? "" : String(id);
  //   if (body && id) {
  //     this.type.value = String(body.type);
  //     this.team.value = String(body.teamID);
  //   }
  // }

  isValid(): boolean {
    return !(isNaN(this.getX1()) || isNaN(this.getY1()) || isNaN(this.getX2()) || isNaN(this.getY2())) || isNaN(this.getPass());
  }

  // getUnit(id: number): MapUnit | undefined {
  //   if (!this.isValid()) {
  //     return undefined;
  //   }

  //   return {
  //     loc: new Victor(this.getX(), this.getY()),
  //     radius: 0.5,
  //     type: this.getType(),
  //     teamID: this.getTeam()
  //   }
  // }
}
