import {Config} from '../config';
import * as cst from '../constants';
import {AllImages} from '../imageloader';

import {schema, flatbuffers} from 'battlecode-playback';
import Victor = require('victor');

import {MapRenderer, Symmetry, MapUnit, HeaderForm, SymmetryForm, UnitForm} from './index';

export type GameMap = {
  name: string,
  width: number,
  height: number,
  units: Map<number, MapUnit>, 
  symmetry: Symmetry
};

/**
 * Reads and interprets information from the map editor input form
 */
export default class MapEditorForm {

  // The public div
  readonly div: HTMLDivElement;

  // HTML elements
  private readonly images: AllImages;
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: MapRenderer;

  // Forms
  private readonly header: HeaderForm;
  private readonly symmetryForm: SymmetryForm;

  private unitForm: UnitForm;
  private mapForm: HTMLDivElement;

  // Options
  private readonly conf: Config

  // Map information
  private lastID: number; // To give bodies unique IDs
  private units: Map<number, MapUnit>;

  constructor(conf: Config, imgs: AllImages, canvas: HTMLCanvasElement) {
    // Store the parameters
    this.conf = conf;
    this.images = imgs;
    this.canvas = canvas;

    // Load HTML elements
    this.div = document.createElement("div");
    this.mapForm = document.createElement("div");

    this.header = new HeaderForm(() => {this.render()});
    this.symmetryForm = new SymmetryForm(() => {this.render()});
    this.unitForm = new UnitForm();

    // Initialize the other fields
    this.lastID = 1;
    this.units = new Map<number, MapUnit>();
    this.loadBaseDiv();

    const onclickTile = (loc: Victor) => {
      let unit = this.unitForm.getUnit();
      unit.loc = loc;
      let symmetrical_unit = this.symmetryForm.transformUnit(unit, this.getMap());
      if (unit.loc.x == symmetrical_unit.loc.x && unit.loc.y == symmetrical_unit.loc.y) {
        if (!unit.teamID) {
          this.addUnit(unit);
        }
      } else {
        this.addUnit(unit);
        this.addUnit(symmetrical_unit);
      }
      this.render();
    }
    this.renderer = new MapRenderer(canvas, conf, onclickTile);

    this.render();
  }

  /**
   * Creates the div that contains all the map-editor related form elements.
   */
  private loadBaseDiv(): void {
    this.div.appendChild(this.header.div);
    this.div.appendChild(this.symmetryForm.div);
    this.div.appendChild(this.unitForm.div);
  }

  private addUnit(unit: MapUnit): void {
    let remove_id: number | null = null;
    let occupied = false;
    this.units.forEach(function(body: MapUnit, id: number) {
      if (body.loc.x == unit.loc.x && body.loc.y == unit.loc.y) {
        remove_id = id;
        if (body.type == unit.type && body.teamID == unit.teamID) {
          occupied = true;
        }
      }
    });
    if (remove_id) {
      this.units.delete(remove_id);
    }
    if (!occupied) {
      this.units.set(this.lastID, unit);
      this.lastID += 1;
    }
  }

  /**
   * Re-renders the canvas based on the parameters of the map editor.
   */
  render() {
    const scale: number = 50; // arbitrary scaling factor
    const width: number = this.header.getWidth() + 2;
    const height: number = this.header.getHeight() + 2;
    this.canvas.width = width * scale;
    this.canvas.height = height * scale;
    this.renderer.render(this.getMap());
  }

  /**
   * Returns a map with the given name, width, height, and bodies.
   */
  getMap(): GameMap {
    return {
      name: this.header.getName(),
      width: this.header.getWidth(),
      height: this.header.getHeight(),
      units: this.units,
      symmetry: this.symmetryForm.getSymmetry()
    };
  }

  reset(): void {
    this.lastID = 1;
    this.units = new Map<number, MapUnit>();
    this.render();
  }
}
import {Config} from '../config';
import * as cst from '../constants';
import {AllImages} from '../imageloader';

import {schema, flatbuffers} from 'battlecode-playback';
import Victor = require('victor');

import {MapRenderer, Symmetry, MapUnit, HeaderForm, SymmetryForm, UnitForm} from './index';

export type GameMap = {
  name: string,
  width: number,
  height: number,
  units: Map<number, MapUnit>, 
  symmetry: Symmetry
};

/**
 * Reads and interprets information from the map editor input form
 */
export default class MapEditorForm {

  // The public div
  readonly div: HTMLDivElement;

  // HTML elements
  private readonly images: AllImages;
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: MapRenderer;

  // Forms
  private readonly header: HeaderForm;
  private readonly symmetryForm: SymmetryForm;

  private unitForm: UnitForm;
  private mapForm: HTMLDivElement;

  // Options
  private readonly conf: Config

  // Map information
  private lastID: number; // To give bodies unique IDs
  private units: Map<number, MapUnit>;

  constructor(conf: Config, imgs: AllImages, canvas: HTMLCanvasElement) {
    // Store the parameters
    this.conf = conf;
    this.images = imgs;
    this.canvas = canvas;

    // Load HTML elements
    this.div = document.createElement("div");
    this.mapForm = document.createElement("div");

    this.header = new HeaderForm(() => {this.render()});
    this.symmetryForm = new SymmetryForm(() => {this.render()});
    this.unitForm = new UnitForm();

    // Initialize the other fields
    this.lastID = 1;
    this.units = new Map<number, MapUnit>();
    this.loadBaseDiv();

    const onclickTile = (loc: Victor) => {
      let unit = this.unitForm.getUnit();
      unit.loc = loc;
      let symmetrical_unit = this.symmetryForm.transformUnit(unit, this.getMap());
      if (unit.loc.x == symmetrical_unit.loc.x && unit.loc.y == symmetrical_unit.loc.y) {
        if (!unit.teamID) {
          this.addUnit(unit);
        }
      } else {
        this.addUnit(unit);
        this.addUnit(symmetrical_unit);
      }
      this.render();
    }
    this.renderer = new MapRenderer(canvas, conf, onclickTile);

    this.render();
  }

  /**
   * Creates the div that contains all the map-editor related form elements.
   */
  private loadBaseDiv(): void {
    this.div.appendChild(this.header.div);
    this.div.appendChild(this.symmetryForm.div);
    this.div.appendChild(this.unitForm.div);
  }

  private addUnit(unit: MapUnit): void {
    let remove_id: number | null = null;
    let occupied = false;
    this.units.forEach(function(body: MapUnit, id: number) {
      if (body.loc.x == unit.loc.x && body.loc.y == unit.loc.y) {
        remove_id = id;
        if (body.type == unit.type && body.teamID == unit.teamID) {
          occupied = true;
        }
      }
    });
    if (remove_id) {
      this.units.delete(remove_id);
    }
    if (!occupied) {
      this.units.set(this.lastID, unit);
      this.lastID += 1;
    }
  }

  /**
   * Re-renders the canvas based on the parameters of the map editor.
   */
  render() {
    const scale: number = 50; // arbitrary scaling factor
    const width: number = this.header.getWidth() + 2;
    const height: number = this.header.getHeight() + 2;
    this.canvas.width = width * scale;
    this.canvas.height = height * scale;
    this.renderer.render(this.getMap());
  }

  /**
   * Returns a map with the given name, width, height, and bodies.
   */
  getMap(): GameMap {
    return {
      name: this.header.getName(),
      width: this.header.getWidth(),
      height: this.header.getHeight(),
      units: this.units,
      symmetry: this.symmetryForm.getSymmetry()
    };
  }

  reset(): void {
    this.lastID = 1;
    this.units = new Map<number, MapUnit>();
    this.render();
  }
}
