import Victor = require('victor');

import {MapUnit} from '../index';

export interface UnitForm {

  // The public div
  readonly div: HTMLDivElement;

  // Form elements for base settings
  readonly id: HTMLLabelElement;
  readonly x: HTMLInputElement;
  readonly y: HTMLInputElement;
  readonly radius: HTMLInputElement;

  // Callbacks on input change
  readonly width: () => number;
  readonly height: () => number;
  readonly maxRadius: (x: number, y: number, ignoreID?: number) => number;

  /**
   * @return the value of the ID field, or undefined if it is not a number
   */
  getID(): number | undefined;

  /**
   * Resets the form by clearing the current location while maintaining the
   * other settings.
   */
  resetForm(): void;

  /**
   * Sets the location to loc, clears the ID, and sets the radius based on the
   * loc and/or the previous radius. If both an ID and a map unit are given,
   * sets all fields other than location to the attributes corresponding to the
   * given map unit.
   * @param loc: a selected location
   * @param body: a selected robot
   * @param id: the selected robot's ID
   */
  setForm(loc: Victor, body?: MapUnit, id?: number): void;

  /**
   * A valid form has numerical input within a specified range for all number
   * fields, and contains all the information necessary to describe a map unit.
   * @return whether or not the form describes a valid map unit.
   */
  isValid(): boolean;

  /**
   * @param teamID: the team ID of the unit; 0=neutral, 1=red, 2=blue
   * @return the map unit described by the form, or undefined if the form is
   * invalid.
   */
  getUnit(teamID?: number): MapUnit | undefined;
}