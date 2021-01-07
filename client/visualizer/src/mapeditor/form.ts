import {Config} from '../config';
import * as cst from '../constants';
import {AllImages} from '../imageloader';

import {schema, flatbuffers} from 'battlecode-playback';
import Victor = require('victor');

import {MapRenderer, Symmetry, MapUnit, HeaderForm, SymmetryForm, RobotForm, TileForm} from './index';

export type GameMap = {
  name: string,
  width: number,
  height: number,
  originalBodies: Map<number, MapUnit>
  symmetricBodies: Map<number, MapUnit>,
  passability: number[]
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

  // Forms and text display
  private readonly header: HeaderForm;
  private readonly symmetry: SymmetryForm;
  private readonly robots: RobotForm;
  private readonly tiles: TileForm;

  private robotsRadio: HTMLInputElement;
  private tilesRadio: HTMLInputElement;

  private forms: HTMLDivElement;

  readonly buttonAdd: HTMLButtonElement;
  readonly buttonDelete: HTMLButtonElement;

  readonly tileInfo: HTMLDivElement;

  // Options
  private readonly conf: Config

  // Map information
  private lastID: number; // To give bodies unique IDs
  private originalBodies: Map<number, MapUnit>;
  private symmetricBodies: Map<number, MapUnit>;
  private passability: number[];

  constructor(conf: Config, imgs: AllImages, canvas: HTMLCanvasElement) {
    // Store the parameters
    this.conf = conf;
    this.images = imgs;
    this.canvas = canvas;

    // fields for placing bodies
    this.lastID = 1;
    this.originalBodies = new Map<number, MapUnit>();
    this.symmetricBodies = new Map<number, MapUnit>();


    // Load HTML elements
    this.div = document.createElement("div");

    // callback functions for getting constants
    const cbWidth = () => {return this.header.getWidth()};
    const cbHeight = () => {return this.header.getHeight()};
    const cbMaxRadius = (x, y, id) => {return this.maxRadius(x, y, id)};

    // header (name, width, height)
    this.header = new HeaderForm(() => {
      this.initPassibility();
      this.render();
    });
    this.div.appendChild(this.header.div);

    // TODO symmetry
    this.symmetry = new SymmetryForm(() => {this.render()});
    // this.div.appendChild(this.symmetry.div);

    // radio buttons
    this.tilesRadio = document.createElement("input");
    this.robotsRadio = document.createElement("input");
    this.div.appendChild(this.createUnitOption());


    // robot delete + add/update buttons
    this.forms = document.createElement("div");
    this.robots = new RobotForm(cbWidth, cbHeight, cbMaxRadius); // robot info (type, x, y, ...)
    this.tiles = new TileForm(cbWidth, cbHeight, cbMaxRadius);
    this.buttonDelete = document.createElement("button");
    this.buttonAdd = document.createElement("button");
    this.div.appendChild(this.forms);

    this.buttonDelete.hidden = true;
    this.buttonAdd.hidden = true;

    // TODO add vertical filler to put form buttons at the bottom
    // validate, remove, reset buttons
    this.div.appendChild(this.createFormButtons());
    this.div.appendChild(document.createElement('hr'));
    
    this.tileInfo = document.createElement("div");
    this.tileInfo.textContent = "X: | Y: | Passability:";
    this.div.appendChild(this.tileInfo);
    this.div.appendChild(document.createElement('hr'));

    // Renderer settings
    const onclickUnit = (id: number) => {
      if (this.originalBodies.has(id) && this.getActiveForm() == this.robots) {
        // Set the corresponding form appropriately
        let body: MapUnit = this.originalBodies.get(id)!;
        this.robotsRadio.click();
        this.robots.setForm(body.loc, body, id);
      }
    };

    const onclickBlank = (loc: Victor) => {
      this.getActiveForm().setForm(loc);
    };

    const onMouseover = (x: number, y: number, passability: number) => {
      let content: string = "";
      content += 'X: ' + `${x}`.padStart(3);
      content += ' | Y: ' + `${y}`.padStart(3);
      content += ' | Passability: ' + `${passability.toFixed(3)}`;
      this.tileInfo.textContent = content;
    };

    this.renderer = new MapRenderer(canvas, imgs, conf, onclickUnit, onclickBlank, onMouseover);

    this.initPassibility();

    // Load callbacks and finally render
    this.loadCallbacks();
    this.render();
  }

  private createUnitOption(): HTMLFormElement {
    const div = document.createElement("form");

    // Radio button for changing tile passabilities
    this.tilesRadio.id = "tiles-radio";
    this.tilesRadio.type = "radio";
    this.tilesRadio.name = "edit-option"; // radio buttons with same name are mutually exclusive

    this.tilesRadio.onchange = () => {
      // Change the displayed form
      if (this.tilesRadio.checked) {
        while (this.forms.firstChild) this.forms.removeChild(this.forms.firstChild);
        this.forms.appendChild(this.tiles.div);
        this.buttonDelete.hidden = true;
        this.buttonAdd.hidden = false;
      }
    };
    const tilesLabel = document.createElement("label");
    tilesLabel.setAttribute("for", this.tilesRadio.id);
    tilesLabel.textContent = "Change Tiles";


    // Radio button for placing units
    this.robotsRadio.id = "robots-radio"; 
    this.robotsRadio.type = "radio";
    this.robotsRadio.name = "edit-option";

    this.robotsRadio.onchange = () => {
      // Change the displayed form
      if (this.robotsRadio.checked) {
        while (this.forms.firstChild) this.forms.removeChild(this.forms.firstChild);
        this.forms.appendChild(this.robots.div);
        this.buttonDelete.hidden = false;
        this.buttonAdd.hidden = false;
      }
    };
    const robotsLabel = document.createElement("label");
    robotsLabel.setAttribute("for", this.robotsRadio.id);
    robotsLabel.textContent = "Place Robots";


    // Add radio buttons HTML element
    div.appendChild(this.tilesRadio);
    div.appendChild(tilesLabel);
    div.appendChild(this.robotsRadio);
    div.appendChild(robotsLabel);
    div.appendChild(document.createElement("br"));

    return div;
  }

  private createFormButtons(): HTMLDivElement {
    // HTML structure
    const buttons = document.createElement("div");
    buttons.appendChild(this.buttonDelete);
    buttons.appendChild(this.buttonAdd);

    // Delete and Add/Update buttons
    this.buttonDelete.type = "button";
    this.buttonDelete.className = "form-button";
    this.buttonDelete.appendChild(document.createTextNode("Delete"));    
    this.buttonAdd.type = "button";
    this.buttonAdd.className = "form-button";
    this.buttonAdd.appendChild(document.createTextNode("Add/Update"));

    return buttons;
  }

  private loadCallbacks() {
    this.buttonAdd.onclick = () => {
      if (this.getActiveForm() == this.robots) {
        const form: RobotForm = this.robots;
        const id: number = form.getID() || this.lastID;
        const unit: MapUnit | undefined = form.getUnit(id);
        if (unit) {
          // Create a new unit or update an existing unit
          this.setUnit(id, unit);
          form.resetForm();
        }
      }
      if (this.getActiveForm() == this.tiles) {
        const form: TileForm = this.tiles;
        const x1: number = form.getX1();
        const x2: number = form.getX2();
        const y1: number = form.getY1();
        const y2: number = form.getY2();
        const pass: number = form.getPass();
        this.setPassability(x1, y1, x2, y2, pass);
      }
    }

    this.buttonDelete.onclick = () => {
      if (this.getActiveForm() == this.robots) {
        const id: number | undefined = this.robots.getID();
        if (id && !isNaN(id)) {
          this.deleteUnit(id);
          this.getActiveForm().resetForm();
        }
      }
    }
  }

  /**
   * Given an x, y on the map, returns the maximum radius such that the
   * corresponding unit centered on x, y is cst.DELTA away from any other existing
   * unit. Returns 0 if no such radius exists.
   *
   * If an id is given, does not consider the body with the corresponding id to
   * overlap with the given coordinates.
   */
  private maxRadius(x: number, y: number, ignoreID?: number): number {
    // Min distance to wall
    let maxRadius = Math.min(x, y, this.header.getWidth()-x, this.header.getHeight()-y);
    const loc = new Victor(x, y);

    // Min distance to tree or body
    ignoreID = ignoreID || -1;
    this.originalBodies.forEach((body: MapUnit, id: number) => {
      if (id != ignoreID) {
        maxRadius = Math.min(maxRadius, loc.distance(body.loc) - body.radius);
      }
    });
    this.symmetricBodies.forEach((body: MapUnit, id: number) => {
      if (id != ignoreID) {
        maxRadius = Math.min(maxRadius, loc.distance(body.loc) - body.radius);
      }
    });

    return Math.max(0, maxRadius - cst.DELTA);
  }

  /**
   * If a unit with the given ID already exists, updates the existing unit.
   * Otherwise, adds the unit to the internal units and increments lastID.
   * Finally re-renders the canvas.
   */
  private setUnit(id: number, body: MapUnit): void {
    if (!this.originalBodies.has(id)) {
      this.lastID += 1;
    }
    this.originalBodies.set(id, body);
    this.render();
  }

  /**
   * Deletes the tree/archon with the given ID if it exists and re-renders
   * the canvas. Otherwise does nothing.
   */
  private deleteUnit(id: number): void {
    if (this.originalBodies.has(id)) {
      this.originalBodies.delete(id);
      this.render();
    }
  }

  /**
   * Initialize passability array based on map dimensions.
   */
  private initPassibility() {
    this.passability = new Array(this.header.getHeight() * this.header.getWidth());
    this.passability.fill(0.5);
  }

  /**
   * Set passability of all tiles from top-left to bottom-right.
   */
  private setPassability(x1: number, y1: number, x2: number, y2: number, pass: number) {
    for (let x = x1; x <= x2; x++) {
      for (let y = y1; y <= y2; y++) {
        this.passability[y*this.header.getWidth() + x] = pass;
      }
    }
    this.render();
  }

  /**
   * @return the active form based on which radio button is selected
   */
  private getActiveForm(): RobotForm | TileForm {
    return (this.tilesRadio.checked ? this.tiles : this.robots)
  }

  /**
   * Re-renders the canvas based on the parameters of the map editor.
   */
  render() {
    const scale: number = 50; // arbitrary scaling factor
    const width: number = this.header.getWidth();
    const height: number = this.header.getHeight();
    this.canvas.width = width * scale;
    this.canvas.height = height * scale;
    this.symmetricBodies = this.symmetry.getSymmetricBodies(this.originalBodies, width, height);
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
      originalBodies: this.originalBodies,
      symmetricBodies: this.symmetricBodies,
      passability: this.passability
    };
  }

  reset(): void {
    this.lastID = 1;
    this.originalBodies = new Map<number, MapUnit>();
    this.symmetricBodies = new Map<number, MapUnit>();
    this.render();
  }
}
