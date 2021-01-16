import {Config} from '../config';
import * as cst from '../constants';
import {AllImages} from '../imageloader';
import {cow_border as cow} from '../cow';

import {schema, flatbuffers} from 'battlecode-playback';
import Victor = require('victor');

import {MapRenderer, HeaderForm, SymmetryForm, RobotForm, TileForm} from './index';
import { SSL_OP_NO_QUERY_MTU } from 'constants';

export type MapUnit = {
  loc: Victor,
  type: schema.BodyType,
  radius: 0.5,
  teamID?: number,
  influence: number
};

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
  readonly buttonReverse: HTMLButtonElement;
  readonly buttonRandomize: HTMLButtonElement;
  readonly buttonInvert: HTMLButtonElement;

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

    // header (name, width, height)
    this.header = new HeaderForm(() => {
      this.reset();
      this.render();
    });
    this.div.appendChild(this.header.div);

    // symmetry
    this.symmetry = new SymmetryForm(() => {this.initPassibility(); this.render()});
    this.div.appendChild(document.createElement("br"));
    this.div.appendChild(this.symmetry.div);
    this.div.appendChild(document.createElement("br"));
    this.div.appendChild(document.createElement("hr"));

    // radio buttons
    this.tilesRadio = document.createElement("input");
    this.robotsRadio = document.createElement("input");
    this.div.appendChild(this.createUnitOption());
    this.div.appendChild(document.createElement("br"));

    // robot delete + add/update buttons
    this.forms = document.createElement("div");
    this.robots = new RobotForm(cbWidth, cbHeight); // robot info (type, x, y, ...)
    this.tiles = new TileForm(cbWidth, cbHeight);
    this.buttonDelete = document.createElement("button");
    this.buttonAdd = document.createElement("button");
    this.buttonReverse = document.createElement("button");
    this.buttonRandomize = document.createElement("button");
    this.buttonInvert = document.createElement("button");
    this.div.appendChild(this.forms);

    this.buttonDelete.style.display = "none";
    this.buttonAdd.style.display = "none";
    this.buttonReverse.style.display = "none";
    this.buttonRandomize.style.display = "none";
    this.buttonInvert.style.display = "none";

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

    const onDrag = (loc: Victor) => {
      if (this.getActiveForm() === this.tiles && this.tiles.isValid()) {
        let r: number = this.tiles.getBrush();
        let inBrush: (dx, dy) => boolean = () => true;
        switch (this.tiles.getStyle()) {
          case "Circle":
            inBrush = (dx, dy) => dx*dx + dy*dy <= r*r;
            break;
          case "Square":
            inBrush = (dx, dy) => Math.max(Math.abs(dx), Math.abs(dy)) <= r;
            break;
          case "Cow":
            inBrush = (dx,dy) => (Math.abs(dx) < r && Math.abs(dy) < r && cow[Math.floor(20*(1+dx/r))][Math.floor(20*(1-dy/r))]);
        }
        this.setAreaPassability(loc.x, loc.y, this.tiles.getPass(), inBrush);
        this.render();
      }
    }

    this.renderer = new MapRenderer(canvas, imgs, conf, onclickUnit, onclickBlank, onMouseover, onDrag);

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
        this.buttonDelete.style.display = "none";
        this.buttonAdd.style.display = "none";
        this.buttonReverse.style.display = "none";
        this.buttonRandomize.style.display = "";
        this.buttonInvert.style.display = "";
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
        this.buttonDelete.style.display = "";
        this.buttonAdd.style.display = "";
        this.buttonReverse.style.display = "";
        this.buttonRandomize.style.display = "none";
        this.buttonInvert.style.display = "none";
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
    buttons.appendChild(this.buttonReverse);
    buttons.appendChild(this.buttonRandomize);
    buttons.appendChild(this.buttonInvert);

    // Delete and Add/Update buttons
    this.buttonDelete.type = "button";
    this.buttonDelete.className = "form-button custom-button";
    this.buttonDelete.appendChild(document.createTextNode("Delete"));
    this.buttonAdd.type = "button";
    this.buttonAdd.className = "form-button custom-button";
    this.buttonAdd.appendChild(document.createTextNode("Add/Update"));
    this.buttonReverse.type = "button";
    this.buttonReverse.className = "form-button custom-button";
    this.buttonReverse.appendChild(document.createTextNode("Switch Team"));
    this.buttonRandomize.type = "button";
    this.buttonRandomize.className = "form-button custom-button";
    this.buttonRandomize.appendChild(document.createTextNode("Randomize Tiles"));
    this.buttonInvert.type = "button";
    this.buttonInvert.className = "form-button custom-button";
    this.buttonInvert.appendChild(document.createTextNode("Invert values"));

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

    this.buttonReverse.onclick = () => {
      if (this.getActiveForm() == this.robots) {
        const form: RobotForm = this.robots;
        const id: number = form.getID() || this.lastID - 1;
        const unit: MapUnit = this.originalBodies.get(id)!;
        if (unit) {
          var teamID: number = unit.teamID === undefined? 0 : unit.teamID;
          if(teamID > 0) {
            teamID = 3 - teamID;
          }
          unit.teamID = teamID;
          // Create a new unit or update an existing unit
          this.setUnit(id, unit);
          form.resetForm();
        }
      }
    }

    this.buttonRandomize.onclick = () => {
      if (this.getActiveForm() == this.tiles) {
        for(let x: number = 0; x < this.header.getWidth(); x++) {
          for(let y:number = 0; y < this.header.getHeight(); y++) {
            this.setPassability(x, y, Math.random() * 0.9 + 0.1);
          }
        }
        this.render();
      }
    }

    this.buttonInvert.onclick = () => {
      if (this.getActiveForm() == this.tiles) {
        for(let x: number = 0; x < this.header.getWidth(); x++) {
          for(let y: number = 0; y < this.header.getHeight(); y++) {
            this.passability[y*this.header.getWidth() + x] = 1.1 - this.getPassability(x,y);
          }
        }
        this.render();
      }
    }

    // this.buttonSmoothen.onclick = () => {
    //   if (this.getActiveForm() == this.tiles) {
    //     for(let x: number = 0; x < this.header.getWidth(); x++) {
    //       for(let y: number = 0; y < this.header.getHeight(); y++) {
    //         //let sum = 0, n = 0;
    //         let high = this.getPassability(x, y);
    //         let low = this.getPassability(x, y);
    //         for (let x2 = Math.max(0,x-1); x2 <= Math.min(x+1, this.header.getWidth()-1); x2++) {
    //           for (let y2 = Math.max(0,y-1); y2 <= Math.min(y+1, this.header.getWidth()-1); y2++) {
    //            // if (Math.abs(x-x2) + Math.abs(y-y2) > 1) continue; // bad code
    //            // sum += this.getPassability(x2, y2);
    //             //n++;
    //             high = Math.max(this.getPassability(x2, y2), high);
    //             low = Math.min(this.getPassability(x2, y2), high);
    //           }
    //         } 
    //         this.setPassability(x,y, (high+low)/2);
    //       }
    //     }
    //     this.render();
    //   }
    // }
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
    this.passability.fill(1);
  }

  private getPassability(x: number, y: number) {
    return this.passability[y*this.header.getWidth() + x];
  }

  private setPassability(x: number, y: number, pass: number) {
    const translated: Victor = this.symmetry.transformLoc(new Victor(x, y), this.header.getWidth(), this.header.getHeight());
    this.passability[y*this.header.getWidth() + x] = this.passability[translated.y*this.header.getWidth() + translated.x] = pass;
  }

  private setAreaPassability(x0: number, y0: number, pass: number, inBrush: (dx, dy) => boolean) {
    const width = this.header.getWidth();
    const height = this.header.getHeight();

   for (let x = 0; x < width; x++) {
     for (let y = 0; y < height; y++) {
       if (inBrush(x-x0, y-y0)) {
          this.setPassability(x, y, pass);
       }
     }
   }
  }

  /**
   * Set passability of all tiles from top-left to bottom-right.
   */
  private setRectPassability(x1: number, y1: number, x2: number, y2: number, pass: number) {
    for (let x = x1; x <= x2; x++) {
      for (let y = y1; y <= y2; y++) {
        this.setPassability(x, y, pass);
      }
    }
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
    const width: number = this.header.getWidth();
    const height: number = this.header.getHeight();
    const scale: number = this.conf.upscale / Math.sqrt(width * height); // arbitrary scaling factor
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

  getMapJSON(): string {
    // from https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map/56150320
    const map = this.getMap();
    function replacer(key, value) {
      const originalObject = this[key];
      if(originalObject instanceof Map) {
        return {
          dataType: 'Map',
          value: Array.from(originalObject.entries()), // or with spread: value: [...originalObject]
        };
      } else {
        return value;
      }
    }
    return JSON.stringify(map, replacer);
  }

  setMap(mapJSON) {
    // from https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map/56150320
    function reviver(key, value) {
      if(typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
          return new Map(value.value);
        }
      }
      return value;
    }
    const map = JSON.parse(mapJSON, reviver);
    this.header.setName(map.name);
    this.header.setWidth(map.width);
    this.header.setHeight(map.height);

    this.originalBodies = map.originalBodies;
    this.symmetricBodies = map.symmetricBodies;

    this.passability = map.passability;
    this.render();
  }

  reset(): void {
    this.lastID = 1;
    this.originalBodies = new Map<number, MapUnit>();
    this.symmetricBodies = new Map<number, MapUnit>();
    this.initPassibility();
    this.render();
  }
}
