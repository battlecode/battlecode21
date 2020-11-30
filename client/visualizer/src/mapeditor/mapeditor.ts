import {Config} from '../config';
import * as cst from '../constants';
import {AllImages} from '../main/imageloader';
import ScaffoldCommunicator from '../main/scaffold';

import {schema, flatbuffers} from 'battlecode-playback';
import Victor = require('victor');

import {MapUnit, MapValidator, MapGenerator, MapEditorForm, GameMap} from './index';

/**
 * Allows the user to download a .map17 file representing the map generated
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
    this.div = this.basediv();
    this.images = images;
    this.conf = conf;
  }

  private basediv(): HTMLDivElement {
    let div = document.createElement("div");
    div.id = "mapEditor";

    div.appendChild(document.createElement("br"));
    div.appendChild(this.form.div);

    div.appendChild(this.validateButton());
    div.appendChild(this.removeInvalidButton());
    div.appendChild(this.resetButton());
    div.appendChild(document.createElement("br"));
    div.appendChild(document.createElement("br"));

    div.appendChild(this.exportButton());
    div.appendChild(document.createElement("br"));

    const helpDiv = document.createElement("div");
    helpDiv.style.textAlign = "left";
    div.appendChild(helpDiv);

    helpDiv.innerHTML = `Help text is not yet written :p`;
    // `<i><br>Tip: "S"=quick add, "D"=quick delete.<br><br>
    //   Note: In tournaments, a starting map consists only of neutral trees and
    //   ${cst.MIN_NUMBER_OF_ARCHONS} to ${cst.MAX_NUMBER_OF_ARCHONS} archons per
    //   team. The validator only checks for overlapping and off-map units.<br><br>
    //   Note: The map editor currently does not support bullet trees.</i>`;

    return div;
  }

  /**
   * Quick add and delete units in the map editor
   */
  onkeydown(): (event: KeyboardEvent) => void {
    return (event: KeyboardEvent) => {
      var input = (<Element>document.activeElement).nodeName == "INPUT";
      if(!input) {
        switch (event.keyCode) {
          case 67: // "c" - Toggle Circle Bots
            this.conf.circleBots = !this.conf.circleBots;
            this.form.render();
            break;
          case 83: // "s" - Set (Add/Update)c
            this.form.buttonAdd.click();
            break;
          case 68: // "d" - Delete
            this.form.buttonDelete.click();
            break;
        }
      }
    };
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
    button.appendChild(document.createTextNode("Validate"));
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
    button.className = 'form-button';
    button.appendChild(document.createTextNode("RESET"));
    button.onclick = () => {
      let youAreSure = confirm(
        "WARNING: you will lose all your data. Click OK to continue anyway.");
      if (youAreSure) {
        this.form.reset();
      }
    };
    return button;
  }

  private exportButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.id = "export";
    button.type = "button";
    button.appendChild(document.createTextNode("EXPORT!"));

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
              alert("Good to go! Click \"Refresh\" in the Queue to use your new map.");
            }
          });
        } else {
          MapGenerator.exportFile(data, `${name}.map17`);
        }
      }
    }
    return button;
  }
}
