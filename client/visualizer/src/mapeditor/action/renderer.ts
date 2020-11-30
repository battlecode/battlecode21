import * as config from '../../config';
import * as cst from '../../constants';

import {GameWorld, schema} from 'battlecode-playback';
import {AllImages} from '../../imageloader';
import Victor = require('victor');

import {GameMap} from '../index';

export type MapUnit = {
  loc: Victor,
  radius: number,
  type: schema.BodyType,
  teamID?: number
};

export enum Symmetry {
  ROTATIONAL,
  HORIZONTAL,
  VERTICAL
};

/**
 * Renders the world.
 *
 * Note that all rendering functions draw in world-units,
 */
export default class MapRenderer {
  private conf: config.Config;

  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly imgs: AllImages;

  // Callbacks for clicking robots and trees on the canvas
  readonly onclickUnit: (id: number) => void;
  readonly onclickBlank: (loc: Victor) => void;

  // Other useful values
  readonly bgPattern: CanvasPattern;
  private width: number; // in world units
  private height: number; // in world units

  constructor(canvas: HTMLCanvasElement, imgs: AllImages, conf: config.Config,
    onclickUnit: (id: number) => void, onclickBlank: (loc: Victor) => void) {
    this.canvas = canvas;
    this.conf = conf;
    this.imgs = imgs;
    this.onclickUnit = onclickUnit;
    this.onclickBlank = onclickBlank;

    let ctx = canvas.getContext("2d");
    if (ctx === null) {
      throw new Error("Couldn't load canvas2d context");
    } else {
      this.ctx = ctx;
    }

    this.bgPattern = <CanvasPattern>this.ctx.createPattern(imgs.background, 'repeat');
  }

  /**
   * Renders the game map.
   */
  render(map: GameMap): void {
    const scale = this.canvas.width / map.width;
    this.width = map.width;
    this.height = map.height;

    // setup correct rendering
    this.ctx.save();
    this.ctx.scale(scale, scale);

    this.renderBackground();
    this.renderBodies(map);

    // restore default rendering
    this.setEventListener(map);
    this.ctx.restore();
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
    this.ctx.save();
    this.ctx.fillStyle = this.bgPattern;

    const scale = 20;
    this.ctx.scale(1/scale, 1/scale);

    // scale the background pattern
    this.ctx.fillRect(0, 0, this.width * scale, this.height * scale);
    this.ctx.restore();
  }

  /**
   * Draw trees and units on the canvas
   */
  private renderBodies(map: GameMap) {

    this.ctx.fillStyle = "#84bf4b";
    map.originalBodies.forEach((body: MapUnit) => {
      const x = body.loc.x;
      const y = this.flip(body.loc.y, map.height);
      const radius = body.radius;
      const type = body.type;
      let img: HTMLImageElement;

      this.drawCircleBot(x, y, radius);
      const teamID = body.teamID || 1;
      img = this.imgs.robot[cst.bodyTypeToString(body.type)][teamID];
      this.drawImage(img, x, y, radius);
      // this.drawGoodies(x, y, radius, body.containedBullets, body.containedBody);
    });

    map.symmetricBodies.forEach((body: MapUnit) => {
      const x = body.loc.x;
      const y = this.flip(body.loc.y, map.height);
      const radius = body.radius;
      let img: HTMLImageElement;

      this.drawCircleBot(x, y, radius);
      img = this.imgs.robot[cst.bodyTypeToString(body.type)][2];
      this.drawImage(img, x, y, radius);
      // this.drawGoodies(x, y, radius, body.containedBullets, body.containedBody);
    });
  }

  /**
   * Sets the map editor display to contain of the information of the selected
   * tree, or on the selected coordinate if there is no tree.
   */
  private setEventListener(map: GameMap) {
    this.canvas.onmousedown = (event: MouseEvent) => {
      let x = map.width * event.offsetX / this.canvas.offsetWidth;
      let y = this.flip(map.height * event.offsetY / this.canvas.offsetHeight, map.height);
      let loc = new Victor(x, y);

      // Get the ID of the selected unit
      let selectedID;
      map.originalBodies.forEach(function(body: MapUnit, id: number) {
        if (loc.distance(body.loc) <= body.radius) {
          selectedID = id;
        }
      });
      map.symmetricBodies.forEach(function(body: MapUnit, id: number) {
        if (loc.distance(body.loc) <= body.radius) {
          selectedID = id;
        }
      });

      if (selectedID) {
        this.onclickUnit(selectedID);
      } else {
        this.onclickBlank(loc);
      }
    };
  }

  /**
   * Draws a circle centered at (x, y) with the given radius
   */
  private drawCircleBot(x: number, y: number, radius: number) {
    if (!this.conf.circleBots) return; // skip if the option is turned off

    this.ctx.beginPath();
    this.ctx.fillStyle = "#ddd";
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    this.ctx.fill();
  }

  /**
   * Draws goodies centered at (x, y) with the given radius, if there are any
   */
  // private drawGoodies(x: number, y: number, radius: number, bullets: number, body: schema.BodyType) {
  //   if (bullets > 0) this.drawImage(this.imgs.tree.bullets, x, y, radius);
  //   if (body !== cst.NONE) this.drawImage(this.imgs.tree.robot, x, y, radius);
  // }

  /**
   * Draws an image centered at (x, y) with the given radius
   */
  private drawImage(img: HTMLImageElement, x: number, y: number, radius: number) {
    this.ctx['imageSmoothingEnabled'] = false;
    this.ctx.drawImage(img, x-radius, y-radius, radius*2, radius*2);
  }
}

