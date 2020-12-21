import {Config} from '../config';
import * as cst from '../constants';
import {AllImages} from '../imageloader';
import ScaffoldCommunicator from '../scaffold';

import {schema, flatbuffers} from 'battlecode-playback';
import Victor = require('victor');

import {MapUnit, MapGenerator, MapEditorForm, GameMap} from './index';

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
    div.appendChild(document.createElement("br"));

    div.appendChild(this.getImportExport());
    div.appendChild(document.createElement("br"));

    // const helpDiv = document.createElement("div");
    // helpDiv.style.textAlign = "left";
    // div.appendChild(helpDiv);

    // helpDiv.innerHTML = `Help text is not yet written :p`;
    // // `<i><br>Tip: "S"=quick add, "D"=quick delete.<br><br>
    // //   Note: In tournaments, a starting map consists only of neutral trees and
    // //   ${cst.MIN_NUMBER_OF_ARCHONS} to ${cst.MAX_NUMBER_OF_ARCHONS} archons per
    // //   team. The validator only checks for overlapping and off-map units.<br><br>
    // //   Note: The map editor currently does not support bullet trees.</i>`;

    return div;
  }

  /**
   * Sets a scaffold if a scaffold directory is found after everything is loaded
   */
  addScaffold(scaffold: ScaffoldCommunicator): void {
    this.scaffold = scaffold;
  }

  private exportButton(): HTMLLabelElement {
    const custom_button = document.createElement("label");
    custom_button.htmlFor = "file-download";
    custom_button.className = "custom-button";
    custom_button.appendChild(document.createTextNode("Export Map"));

    const export_button = document.createElement("button");
    export_button.id = "export";
    export_button.style.display = "none";
    custom_button.appendChild(export_button);

    custom_button.onclick = () => {
      export_button.click();
    }

    export_button.onclick = () => {
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
          MapGenerator.exportFile(data, `${name}.map21`);
        }
      }
    }

    return custom_button;
  }

  private importButton(): HTMLLabelElement {
    const custom_button = document.createElement("label");
    custom_button.htmlFor = "file-upload";
    custom_button.className = "custom-button";
    custom_button.appendChild(document.createTextNode("Import .map21 file"));

    const file_upload = document.createElement("input");
    file_upload.type = "file";
    file_upload.id = "import";
    file_upload.accept = ".map21";
    custom_button.appendChild(file_upload);

    custom_button.onclick = () => {
      file_upload.click();
    }

    file_upload.onchange = () => {
      if (!file_upload.files) {
        return;
      }
      var file = file_upload.files[0];
      MapGenerator.importFile(file);
    }

    return custom_button;
  }

  private getImportExport(): HTMLDivElement {
    const div = document.createElement("div");
    const form = document.createElement("form");

    const import_button = this.importButton();
    const export_button = this.exportButton();

    form.appendChild(import_button);
    form.appendChild(export_button);

    div.appendChild(form);
    return div;
  }
}
