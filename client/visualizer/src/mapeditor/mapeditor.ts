import {Config} from '../config';
import * as cst from '../constants';
import {AllImages} from '../imageloader';
import ScaffoldCommunicator from '../main/scaffold';
import {electron} from '../main/electron-modules';

import {schema, flatbuffers} from 'battlecode-playback';
import Victor = require('victor');

import {MapUnit, MapValidator, MapGenerator, MapEditorForm, GameMap} from './index';
import { env } from 'process';

/**
 * Allows the user to download a .map21 file representing the map generated
 * in the map editor.
 */
export default class MapEditor {

  // The public div
  readonly div: HTMLDivElement;

  // HTML elements
  private readonly images: AllImages;
  private readonly form: MapEditorForm;
  readonly canvas: HTMLCanvasElement;

  // Options
  private readonly conf: Config;

  // Scaffold
  private scaffold: ScaffoldCommunicator | null;

  constructor(conf: Config, images: AllImages) {
    this.canvas = document.createElement("canvas");
    this.form = new MapEditorForm(conf, images, this.canvas);
    this.scaffold = null;
    this.images = images;
    this.conf = conf;
    this.div = this.basediv();
  }

  private basediv(): HTMLDivElement {
    let div = document.createElement("div");
    div.id = "mapEditor";

    div.appendChild(document.createElement("b"));

    div.appendChild(document.createElement("br"));
    div.appendChild(this.form.div);

    //div.appendChild(this.validateButton());
    // TODO
    // div.appendChild(this.removeInvalidButton());
    div.appendChild(this.resetButton());
    div.appendChild(document.createElement("br"));
    div.appendChild(this.getMapJSONButton());
    div.appendChild(this.pasteMapJSONButton());
    div.appendChild(document.createElement("br"));

    div.appendChild(this.exportButton());
    div.appendChild(document.createElement("br"));
    div.appendChild(document.createElement("hr"));

    const helpDiv = document.createElement("div");
    helpDiv.style.textAlign = "left";
    div.appendChild(document.createElement("br"));
    div.appendChild(helpDiv);

    helpDiv.innerHTML = `<b class="blue">Keyboard Shortcuts (Map Editor)</b><br>
      S - Add<br>
      D - Delete<br>
      R - Reverse team<br>
      <br>
      <b class="blue">How to Use the Map Editor</b><br>
      Select the initial map settings: name, width, height, and symmetry. <br>
      <br>
      To place enlightenment centers, enter the "change robots" mode, set the coordinates, set the initial influence of the
      center (abbreviated as "I"), and click "Add/Update" or "Delete." The coordinates can also be set by clicking the map.
      <!--The "ID" of a robot is a unique identifier for a pair of symmetric robots. It is not the ID the robot will have in the game! --><br>
      <br>
      To set tiles' passability values, enter the "change tiles" mode, select the passability value, brush size, and brush style,
      and then <b>hold and drag</b> your mouse across the map. <br>
      <br>
      To save an intermediary version of your map, copy the map JSON. You can input this JSON later to retrieve your map in the map editor for further editing. <br>
      <br>
      <!--Before exporting, click "Validate" to see if any changes need to be
      made, and <b>"Remove Invalid Units"</b> to automatically remove off-map or
      overlapping units. -->
      When you are happy with your map, click "Export".
      If you are directed to save your map, save it in the
      <code>/battlecode-scaffold-2021/maps</code> directory of your scaffold.
      (Note: the name of your <code>.map21</code> file must be the same as the name of your
      map.) <br>
      <br>
      Exported file name must be the same as the map name chosen above. For instance, <code>DefaultMap.bc21</code>.`;

    return div;
  }

  /**
   * Quick add and delete units in the map editor
   */
  readonly onkeydown = (event: KeyboardEvent) => {
    var input = (<Element>document.activeElement).nodeName == "INPUT";
    if(!input) {
      switch (event.keyCode) {
        case 83: // "s" - Set (Add/Update)c
          this.form.buttonAdd.click();
          break;
        case 68: // "d" - Delete
          this.form.buttonDelete.click();
          break;
        case 82: // "r" - Reverse team
          this.form.buttonReverse.click();
          break;
      }
    }
  }

  private isValid(): boolean {
    return MapValidator.isValid(this.form.getMap());
  }

  private removeInvalidUnits(): void {
    MapValidator.removeInvalidUnits(
      this.form.getMap(),
      () => {this.form.render()}
    );
  }

  private validateButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = 'form-button';
    button.appendChild(document.createTextNode("Validate Map"));
    button.onclick = () => {
      if (this.isValid()) {
        alert("Congratulations! Your map is valid. :)")
      }
    };
    return button;
  }

  /**
   * Sets a scaffold if a scaffold directory is found after everything is loaded
   */
  addScaffold(scaffold: ScaffoldCommunicator): void {
    this.scaffold = scaffold;
  }

  private removeInvalidButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = 'form-button';
    button.appendChild(document.createTextNode("Remove invalid units"));
    button.onclick = () => {
      let youAreSure = confirm(
        "WARNING: you will permanently lose all invalid units. Click OK to continue anyway.");
      if (youAreSure) {
        this.removeInvalidUnits();
      }
    };
    return button;
  }

  private resetButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = 'form-button custom-button';
    button.appendChild(document.createTextNode("Reset Map"));
    button.onclick = () => {
      this.form.reset();
    };
    return button;
  }

  private getMapJSONButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = 'form-button custom-button';
    button.appendChild(document.createTextNode(process.env.ELECTRON ? "Copy Map JSON to Clipboard" : "Get Map JSON"));
    button.onclick = () => {
      // from https://stackoverflow.com/questions/17591559/how-to-copy-text-of-alert-box
      if (!process.env.ELECTRON) {
        const newWin = window.open();
        if (newWin) {
          newWin.document.write(this.form.getMapJSON());
          newWin.document.close();
        }
      }
      else {
       // prompt("Copy to clipboard: Ctrl+C, Enter", this.form.getMapJSON());
       electron.clipboard.writeText(this.form.getMapJSON());
      }
    };
    return button;
  }

  private pasteMapJSONButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = 'form-button custom-button';
    button.appendChild(document.createTextNode(process.env.ELECTRON ? "Input Map JSON from Clipboard" : "Input Map JSON"));
    button.onclick = () => {
      if (!process.env.ELECTRON) this.form.setMap(prompt("Paste Map JSON: Ctrl+V, Enter"));
      else this.form.setMap(electron.clipboard.readText());
    };
    return button;
  }

  private exportButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.id = "export";
    button.type = "button";
    button.innerText = "Export!";
    button.className = 'form-button custom-button';

    button.onclick = () => {
      if (!this.isValid()) return;

      let name = this.form.getMap().name;
      let data: Uint8Array | undefined = MapGenerator.generateMap(this.form.getMap());

      if (data) {
        if (process.env.ELECTRON && this.scaffold) {
          this.scaffold.saveMap(data, name, (err: Error | null) => {
            if (err) {
              console.log(err);
            } else {
              // alert("Good to go! Click \"Refresh\" in the Queue to use your new map.");
              alert("Successfully exported!");
            }
          });
        } else {
          MapGenerator.exportFile(data, `${name}.map21`);
        }
      }
    }
    return button;
  }
}
