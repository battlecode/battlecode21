import * as config from '../../config';
import * as cst from '../../constants';

import {GameWorld, schema} from 'battlecode-playback';
import {AllImages} from '../../imageloader';
import Victor = require('victor');

import {GameMap} from '../index';

export type MapUnit = {
  loc: Victor,
  type: schema.BodyType,
  teamID?: number
};

enum UnitType {
  RED_ENLIGHTENMENT, 
  BLUE_ENLIGHTENMENT, 
  NEUTRAL_ENLIGHTENMENT, 
  SWAMP, 
  TERRAIN
}

/**
 * Renders the world.
 *
 * Note that all rendering functions draw in world-units,
 */
export default class MapRenderer {
  private conf: config.Config;

  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  // Other useful values
  readonly onclickTile: (Victor) => void;
  private width: number; // in world units
  private height: number; // in world units

  private mousePosition: Victor;

  constructor(canvas: HTMLCanvasElement, conf: config.Config, 
              onclickTile: (Victor) => void) {
    this.canvas = canvas;
    this.conf = conf;
    this.onclickTile = onclickTile;

    let ctx = canvas.getContext("2d");
    if (ctx === null) {
      throw new Error("Couldn't load canvas2d context");
    } else {
      this.ctx = ctx;
    }
  }

  /**
   * Renders the game map.
   */
  render(map: GameMap): void {
    this.width = map.width;
    this.height = map.height;

    this.renderGraphics(map);
    this.setEventListener(map);
  }

  /**
   * Returns the mirrored y coordinate to be consistent with (0, 0) in the
   * bottom-left corner (top-left corner is canvas default).
   * params: y coordinate to flip
   *         height coordinate of the maximum edge
   */
  private flip(y: number, height: number) {
    return height - y;
  }

  /**
   * Draw the background
   */
  private renderBackground(): void {
    // scale the background pattern
    this.ctx.fillStyle = "rgb(0,0,0)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgb(255,255,255)";
    this.ctx.fillRect(1, 1, this.width, this.height);
  }

  private renderBlanks(map: GameMap) {
    for (let i = 1; i <= this.width; i++) {
      for (let j = 1; j <= this.height; j++) {
        this.setSquare(i, j, null, map);
      }
    }
  }

  /**
   * Draw trees and units on the canvas
   */
  private renderBodies(map: GameMap) {
    this.ctx.fillStyle = "#84bf4b";
    map.units.forEach((body: MapUnit) => {
      const x = body.loc.x;
      const y = body.loc.y;
      const type = body.type;
      let img: HTMLImageElement;

      this.setSquare(x, y, body, map);
    });
  }

  private renderTooltip(map: GameMap, rounded_x: number, rounded_y: number, tooltip_text: string) {
    this.ctx.save();
    const scale = 20;
    const map_scale = this.canvas.width / (map.width + 2);
    this.ctx.scale(map_scale / scale, map_scale / scale);
    this.ctx.font = '15px Arial';

    let text_width = this.ctx.measureText(tooltip_text).width;

    // Draw Rectangle
    let buffer = 0.2 * scale;
    let tooltip_x = rounded_x * scale - text_width / 2;
    let tooltip_y = this.flip(rounded_y, map.height) * scale - 0.5 * scale - buffer;
    let rect_width = text_width + buffer * 2;
    let rect_height = 1 * scale + buffer * 2;
    this.ctx.fillStyle = "rgb(0,0,0)";
    this.ctx.fillRect(tooltip_x - buffer, tooltip_y, rect_width, rect_height);

    // Draw triangle
    let triangle_x = (rounded_x + 0.5) * scale;
    let triangle_y = (this.flip(rounded_y, map.height) + 1) * scale;
    let triangle_height = Math.abs(triangle_y - tooltip_y - rect_height);
    this.ctx.beginPath();
    this.ctx.moveTo(triangle_x, triangle_y);
    this.ctx.lineTo(triangle_x + triangle_height, tooltip_y + rect_height);
    this.ctx.lineTo(triangle_x - triangle_height, tooltip_y + rect_height);
    this.ctx.closePath();
    this.ctx.fill();

    // Write text
    this.ctx.fillStyle = "rgb(255,255,255)";
    this.ctx.fillText(tooltip_text, tooltip_x, tooltip_y + 0.7 * scale);

    this.ctx.restore();
  }

  private renderGraphics(map: GameMap) {
    this.ctx.save();

    const scale = this.canvas.width / (map.width + 2);
    this.ctx.scale(scale, scale);

    this.renderBackground();
    this.renderBlanks(map);
    this.renderBodies(map);

    // restore default rendering
    this.ctx.restore();
  }

  private getEnlightenmentType(unit: MapUnit): UnitType {
    let unit_type: UnitType;
    switch (unit.teamID) {
      case 1: {
        unit_type = UnitType.RED_ENLIGHTENMENT;
        break;
      };
      case 2: {
        unit_type = UnitType.BLUE_ENLIGHTENMENT;
        break;
      };
      default: {
        unit_type = UnitType.NEUTRAL_ENLIGHTENMENT;
      }
    }
    return unit_type;
  }

  private getUnitType(unit: MapUnit | null): UnitType {
    let unit_type = UnitType.TERRAIN;
    if (unit) {
      switch (unit.type) {
        case schema.BodyType.MINER: {
          unit_type = this.getEnlightenmentType(unit);
          break;
        };
        case schema.BodyType.COW: {
          unit_type = UnitType.SWAMP;
          break;
        };
      }
    }

    return unit_type;
  }

  private getUnitTooltip(unit: MapUnit | null): string {
    let unit_type = this.getUnitType(unit);
    let tooltip: string;
    switch (unit_type) {
      case UnitType.RED_ENLIGHTENMENT: {
        tooltip = "Red Enlightenment Center";
        break;
      }
      case UnitType.BLUE_ENLIGHTENMENT: {
        tooltip = "Blue Enlightenment Center";
        break;
      }
      case UnitType.NEUTRAL_ENLIGHTENMENT: {
        tooltip = "Neutral Enlightenment Center";
        break;
      }
      case UnitType.SWAMP: {
        tooltip = "Swampland";
        break;
      }
      default: {
        tooltip = "Terrain";
      }
    }
    return tooltip;
  }

  private getUnitColor(unit: MapUnit | null): string {
    let unit_type = this.getUnitType(unit);
    let color: string;
    switch (unit_type) {
      case UnitType.RED_ENLIGHTENMENT: {
        color = "rgb(219,54,39)";
        break;
      }
      case UnitType.BLUE_ENLIGHTENMENT: {
        color = "rgb(79,126,230)";
        break;
      }
      case UnitType.NEUTRAL_ENLIGHTENMENT: {
        color = "rgb(100,100,100)";
        break;
      }
      case UnitType.SWAMP: {
        color = "rgb(4,81,0)";
        break;
      }
      default: {
         color = "rgb(99,255,32)";
      }
    }
    return color;
  }

  /**
   * Sets the map editor display to contain of the information of the selected
   * tree, or on the selected coordinate if there is no tree.
   */
  private setEventListener(map: GameMap) {
    this.canvas.onmouseup = (event: MouseEvent) => {
      let x = (map.width + 2) * event.offsetX / this.canvas.offsetWidth;
      let y = this.flip((map.height + 2) * event.offsetY / this.canvas.offsetHeight - 2, map.height);
      let rounded_x = Math.floor(x);
      let rounded_y = Math.floor(y);
      let loc = new Victor(rounded_x, rounded_y);

      this.onclickTile(loc);
    };
    this.canvas.onmousemove = (event: MouseEvent) => {
      this.renderGraphics(map);

      let x = (map.width + 2) * event.offsetX / this.canvas.offsetWidth;
      let y = (map.height + 2) * event.offsetY / this.canvas.offsetHeight - 2;
      let rounded_x = Math.floor(x);
      let rounded_y = Math.floor(this.flip(y, map.height));
      let loc = new Victor(rounded_x, rounded_y);
      this.mousePosition = new Victor(rounded_x, rounded_y);

      let tooltip_text = "Terrain";
      map.units.forEach((body: MapUnit) => {
        if (body.loc.x == loc.x && body.loc.y == loc.y) {
          tooltip_text = this.getUnitTooltip(body);
        }
      });
      tooltip_text += " (" + rounded_x.toString() + ", " + rounded_y.toString() + ")";

      this.renderTooltip(map, rounded_x, rounded_y, tooltip_text);
    };
  }

  /**
   * Fills in the square centered at (x, y)
   */
  private setSquare(x: number, y: number, unit: MapUnit | null, map: GameMap) {
    this.ctx.fillStyle = this.getUnitColor(unit);
    const buffer = 0.05;
    const size = 1 - buffer * 2;
    this.ctx.fillRect(x + buffer / 2, this.flip(y, map.height) + buffer / 2 + 1, size, size);
  }
}

