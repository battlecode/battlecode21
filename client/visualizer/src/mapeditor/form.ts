import {Config} from '../config';
import * as cst from '../constants';
import {AllImages} from '../main/imageloader';

import {schema, flatbuffers} from 'battlecode-playback';
import Victor = require('victor');

import {MapRenderer, Symmetry, MapUnit, HeaderForm, SymmetryForm, RobotForm, UnitForm} from './index';

export type GameMap = {
  name: string,
  width: number,
  height: number,
  originalBodies: Map<number, MapUnit>
  symmetricBodies: Map<number, MapUnit>
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
  private readonly symmetry: SymmetryForm;
  // private readonly tree: TreeForm;
  // private readonly archon: ArchonForm;
  private readonly robots: RobotForm;

  private inputArchon: HTMLInputElement;
  private inputTree: HTMLInputElement;
  private inputRobots: HTMLInputElement;
  private forms: HTMLDivElement;

  readonly buttonAdd: HTMLButtonElement;
  readonly buttonDelete: HTMLButtonElement;

  // Options
  private readonly conf: Config

  // Map information
  private lastID: number; // To give bodies unique IDs
  private originalBodies: Map<number, MapUnit>;
  private symmetricBodies: Map<number, MapUnit>;

  constructor(conf: Config, imgs: AllImages, canvas: HTMLCanvasElement) {
    // Store the parameters
    this.conf = conf;
    this.images = imgs;
    this.canvas = canvas;

    // Load HTML elements
    this.div = document.createElement("div");
    this.inputArchon = document.createElement("input");
    this.inputTree = document.createElement("input");
    this.inputRobots = document.createElement("input");
    this.forms = document.createElement("div");
    this.buttonDelete = document.createElement("button");
    this.buttonAdd = document.createElement("button");

    // Create the forms
    const cbWidth = () => {return this.header.getWidth()};
    const cbHeight = () => {return this.header.getHeight()};
    const cbMaxRadius = (x, y, id) => {return this.maxRadius(x, y, id)};
    this.header = new HeaderForm(() => {this.render()});
    this.symmetry = new SymmetryForm(() => {this.render()});
    // this.tree = new TreeForm(cbWidth, cbHeight, cbMaxRadius);
    // this.archon = new ArchonForm(cbWidth, cbHeight, cbMaxRadius);
    this.robots = new RobotForm(cbWidth, cbHeight, cbMaxRadius);

    // Initialize the other fields
    this.lastID = 1;
    this.originalBodies = new Map<number, MapUnit>();
    this.symmetricBodies = new Map<number, MapUnit>();
    this.loadBaseDiv();

    const onclickUnit = (id: number) => {
      if (this.originalBodies.has(id)) {
        // Set the corresponding form appropriately
        let body: MapUnit = this.originalBodies.get(id)!;
        this.inputRobots.click();
        this.getActiveForm().setForm(body.loc, body, id);
      }
    };
    const onclickBlank = (loc: Victor) => {
      this.getActiveForm().setForm(loc);
    }
    this.renderer = new MapRenderer(canvas, imgs, conf, onclickUnit, onclickBlank);

    // Load callbacks and finally render
    this.loadCallbacks();
    this.render();
  }

  /**
   * Creates the div that contains all the map-editor related form elements.
   */
  private loadBaseDiv(): void {
    // this.forms.appendChild(this.tree.div);

    this.div.appendChild(this.header.div);
    this.div.appendChild(this.symmetry.div);
    this.div.appendChild(this.createUnitOption());

    this.div.appendChild(this.forms);
    this.div.appendChild(this.createFormButtons());
  }

  private createUnitOption(): HTMLDivElement {
    const div = document.createElement("div");

    // Tree option
    this.inputTree.type = "radio";
    this.inputTree.name = "bodytype";
    this.inputTree.checked = true;

    // Archon option
    this.inputArchon.type = "radio";
    this.inputArchon.name = "bodytype";

    // Robots option
    this.inputRobots.type = "radio";
    this.inputRobots.name = "bodytype";

    // Add radio buttons HTML element
    div.appendChild(this.inputTree);
    div.appendChild(document.createTextNode("Tree"));
    div.appendChild(this.inputArchon);
    div.appendChild(document.createTextNode("Archon"));
    div.appendChild(this.inputRobots);
    div.appendChild(document.createTextNode("Robots"));
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

    this.inputTree.onchange = () => {
      // Change the displayed form
      while (this.forms.firstChild) this.forms.removeChild(this.forms.firstChild);
      // if (this.inputTree.checked) {
      //   this.forms.appendChild(this.tree.div);
      // }
    };
    this.inputArchon.onchange = () => {
      // Change the displayed form
      while (this.forms.firstChild) this.forms.removeChild(this.forms.firstChild);
      // if (this.inputArchon.checked) {
      //   this.forms.appendChild(this.archon.div);
      // }
    };
    this.inputRobots.onchange = () => {
      // Change the displayed form
      while (this.forms.firstChild) this.forms.removeChild(this.forms.firstChild);
      if (this.inputRobots.checked) {
        this.forms.appendChild(this.robots.div);
      }
    };

    this.buttonAdd.onclick = () => {
      const form: UnitForm = this.getActiveForm()
      const id: number = form.getID() || this.lastID;
      const unit: MapUnit | undefined = form.getUnit();

      if (unit) {
        // Create a new unit or update an existing unit
        this.setUnit(id, unit);
        form.resetForm();
      }
    }

    this.buttonDelete.onclick = () => {
      const id: number | undefined = this.getActiveForm().getID();
      if (id && !isNaN(id)) {
        this.deleteUnit(id);
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
   * @return the active form based on which radio button is selected
   */
  private getActiveForm(): UnitForm {
    // if (this.inputTree.checked) return this.tree;
    // if (this.inputArchon.checked) return this.archon;
    return this.robots;
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
      symmetricBodies: this.symmetricBodies
    };
  }

  reset(): void {
    this.lastID = 1;
    this.originalBodies = new Map<number, MapUnit>();
    this.symmetricBodies = new Map<number, MapUnit>();
    this.render();
  }
}
