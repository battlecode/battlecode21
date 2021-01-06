import * as cst from '../../constants';

import {schema} from 'battlecode-playback';
import Victor = require('victor');

import {MapUnit} from '../index';

export default class RobotForm {

  // The public div
  readonly div: HTMLDivElement;

  // Form elements for archon settings
  readonly id: HTMLLabelElement;
  readonly type: HTMLSelectElement;
  readonly team: HTMLSelectElement;
  readonly x: HTMLInputElement;
  readonly y: HTMLInputElement;

  // Callbacks on input change
  readonly width: () => number;
  readonly height: () => number;
  readonly maxRadius: (x: number, y: number, ignoreID?: number) => number;

  // Constant
  private readonly ROBOT_TYPES: schema.BodyType[] = cst.initialBodyTypeList;

  private readonly TEAMS = {
    "0": "Neutral",
    "1": "Red",
    "2": "Blue"
  };

  constructor(width: () => number, height: () => number,
    maxRadius: (x: number, y: number, ignoreID?: number) => number) {

    // Store the callbacks
    this.width = width;
    this.height = height;
    this.maxRadius = maxRadius;

    // Create HTML elements
    this.div = document.createElement("div");
    this.id = document.createElement("label");
    this.type = document.createElement("select");
    this.team = document.createElement("select");
    this.x = document.createElement("input");
    this.y = document.createElement("input");

    // Create the form
    this.loadInputs();
    this.div.appendChild(this.createForm());
    this.loadCallbacks();
  }

  /**
   * Initializes input fields.
   */
  private loadInputs(): void {
    this.x.type = "text";
    this.y.type = "text";
    this.type.disabled = true;
    this.ROBOT_TYPES.forEach((type: schema.BodyType) => {
      const option = document.createElement("option");
      option.value = String(type);
      option.appendChild(document.createTextNode(cst.bodyTypeToString(type)));
      this.type.appendChild(option);
    });
    for (let team in this.TEAMS) {
      const option = document.createElement("option");
      option.value = String(team);
      option.appendChild(document.createTextNode(this.TEAMS[team]));
      this.team.appendChild(option);
    }
  }

  /**
   * Creates the HTML form that collects archon information.
   */
  private createForm(): HTMLFormElement {
    // HTML structure
    const form: HTMLFormElement = document.createElement("form");
    const id: HTMLDivElement = document.createElement("div");
    const type: HTMLDivElement = document.createElement("div");
    const team: HTMLDivElement = document.createElement("div");
    const x: HTMLDivElement = document.createElement("div");
    const y: HTMLDivElement = document.createElement("div");
    form.appendChild(id);
    form.appendChild(type);
    form.appendChild(team);
    form.appendChild(x);
    form.appendChild(y);
    form.appendChild(document.createElement("br"));
    form.style.textAlign = 'left';

    // Robot ID
    id.appendChild(document.createTextNode("ID: "));
    id.appendChild(this.id);

    // Robot type
    type.appendChild(document.createTextNode("Type: "));
    type.appendChild(this.type);

    // Team
    team.appendChild(document.createTextNode("Team: "));
    team.appendChild(this.team);

    // X coordinate
    x.appendChild(document.createTextNode("X: "));
    x.appendChild(this.x);

    // Y coordinate
    y.appendChild(document.createTextNode("Y: "));
    y.appendChild(this.y);

    return form;
  }

  /**
   * Add callbacks to the form elements.
   */
  private loadCallbacks(): void {

    // X must be in the range [0, this.width]
    this.x.onchange = () => {
      let value: number = this.getX();
      value = Math.max(value, 0);
      value = Math.min(value, this.width());
      this.x.value = isNaN(value) ? "" : String(value);
    };

    // Y must be in the range [0, this.height]
    this.y.onchange = () => {
      let value: number = this.getY();
      value = Math.max(value, 0);
      value = Math.min(value, this.height());
      this.y.value = isNaN(value) ? "" : String(value);
    };
  }


  private getType(): schema.BodyType {
    return parseInt(this.type.options[this.type.selectedIndex].value);
  }

  private getTeam(): number {
    return parseInt(this.team.options[this.team.selectedIndex].value);
  }

  private getX(): number {
    return parseInt(this.x.value);
  }

  private getY(): number {
    return parseInt(this.y.value);
  }

  getID(): number | undefined {
    const id = parseInt(this.id.textContent || "NaN");
    return isNaN(id) ? undefined : id;
  }

  resetForm(): void {
    this.x.value = "";
    this.y.value = "";
  }

  setForm(loc: Victor, body?: MapUnit, id?: number): void {
    this.x.value = String(loc.x);
    this.y.value = String(loc.y);
    this.id.textContent = id === undefined ? "" : String(id);
    if (body && id) {
      this.type.value = String(body.type);
      this.team.value = String(body.teamID);
    }
  }

  isValid(): boolean {
    const x = this.getX();
    const y = this.getY();

    return !(isNaN(x) || isNaN(y));
  }

  getUnit(id: number): MapUnit | undefined {
    if (!this.isValid()) {
      return undefined;
    }

    return {
      loc: new Victor(this.getX(), this.getY()),
      radius: 0.5,
      type: this.getType(),
      teamID: this.getTeam()
    }
  }
}
