import * as cst from '../../constants';

import {schema} from 'battlecode-playback';
import Victor = require('victor');

import {MapUnit} from '../index';

export default class UnitForm {

  // The public div
  readonly div: HTMLDivElement;
  readonly selection: HTMLSelectElement;

  // Constant
  private readonly OPTIONS = {
    "1": "Toggle Swampland", 
    "2": "Toggle Neutral Enlightenment Center", 
    "3": "Toggle Red Enlightenment Center",
    "4": "Toggle Blue Enlightenment Center", 
  };

  constructor() {
    // Create HTML elements
    this.div = document.createElement("div");
    this.div.appendChild(document.createTextNode("Tool: "));
    this.selection = document.createElement("select");

    // Create the form
    this.loadInputs();
    this.div.appendChild(this.selection);
  }

  /**
   * Initializes input fields.
   */
  private loadInputs(): void {
    for (let team in this.OPTIONS) {
      const option = document.createElement("option");
      option.value = team;
      option.text = this.OPTIONS[team];
      this.selection.add(option);
    }
  }

  getUnit(): MapUnit {
    let selected_type = schema.BodyType.MINER;
    let selected_team = 0;
    let curr_selection = this.selection.options[this.selection.selectedIndex].value;
    switch (curr_selection) {
      case "1": {
        selected_type = schema.BodyType.COW;
        selected_team = 0;
        break;
      }
      case "2": {
        selected_type = schema.BodyType.MINER;
        selected_team = 0;
        break;
      }
      case "3": {
        selected_type = schema.BodyType.MINER;
        selected_team = 1;
        break;
      }
      case "4": {
        selected_type = schema.BodyType.MINER;
        selected_team = 2;
        break;
      }
      default: {
        selected_type = schema.BodyType.COW;
        selected_team = 0;
      }
    }
    return {
      loc: new Victor(0, 0),
      type: selected_type, 
      teamID: selected_team
    }
  }
}
