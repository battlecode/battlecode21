import * as config from '../config';
import * as cst from '../constants';
import NextStep from './nextstep';

import {GameWorld, Metadata, schema, Game} from 'battlecode-playback';
import {AllImages} from '../main/imageloader';
import Victor = require('victor');

/**
 * Renders the world.
 *
 * Note that all rendering functions draw in world-units,
 */
export default class Renderer {
  private conf: config.Config;

  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly imgs: AllImages;
  readonly metadata: Metadata;

  // Callbacks
  readonly onRobotSelected: (id: number) => void;
  readonly onMouseover: (x: number, y: number, dirt: number, water: number, pollution: number, soup: number) => void;

  // For rendering robot information on click
  private lastSelectedID: number;

  constructor(canvas: HTMLCanvasElement, imgs: AllImages, conf: config.Config, metadata: Metadata,
    onRobotSelected: (id: number) => void,
    onMouseover: (x: number, y: number, dirt: number, water: number, pollution: number, soup: number) => void) {
    this.canvas = canvas;
    this.conf = conf;
    this.imgs = imgs;
    this.metadata = metadata;
    this.onRobotSelected = onRobotSelected;
    this.onMouseover = onMouseover;

    let ctx = canvas.getContext("2d");
    if (ctx === null) {
        throw new Error("Couldn't load canvas2d context");
    } else {
        this.ctx = ctx;
    }

    this.ctx['imageSmoothingEnabled'] = false;

  }

  /**
   * world: world to render
   * time: time in turns
   * viewMin: min corner of view (in world units)
   * viewMax: max corner of view (in world units)
   */
  render(world: GameWorld, viewMin: Victor, viewMax: Victor, nextStep?: NextStep, lerpAmount?: number) {
    // setup correct rendering
    const viewWidth = viewMax.x - viewMin.x
    const viewHeight = viewMax.y - viewMin.y
    const scale = this.canvas.width / viewWidth;

    this.ctx.save();
    this.ctx.scale(scale, scale);
    this.ctx.translate(-viewMin.x, -viewMin.y);

    this.renderBackground(world);

    this.renderBodies(world, nextStep, lerpAmount);

    this.renderIndicatorDotsLines(world);
    this.renderNetGunShots(world);
    this.setMouseoverEvent(world);

    // restore default rendering
    this.ctx.restore();
  }

  /**
   * Release resources.
   */
  release() {
    // nothing to do yet?
  }

  private renderBackground(world: GameWorld) {
    let dirtLayer = this.conf.viewDirt;
    let waterLayer = this.conf.viewWater;
    let pollutionLayer = this.conf.viewPoll;

    this.ctx.save();
    this.ctx.fillStyle = "white";
    this.ctx.globalAlpha = 1;

    const minX = world.minCorner.x;
    const minY = world.minCorner.y;
    const width = world.maxCorner.x - world.minCorner.x;
    const height = world.maxCorner.y - world.minCorner.y;

    const scale = 20;

    this.ctx.scale(1/scale, 1/scale);

    // scale the background pattern
    this.ctx.fillRect(minX*scale, minY*scale, width*scale, height*scale);

    const map = world.mapStats;

    // TODO use color pacakge for nicer manipulation?
    const getDirtColor = (x: number): string => {

      /*
      I'm thinking the following:
      - A gradient following the rainbow of the following colors. Defined in cst.DIRT_COLORS
      */

      

      // // (-inf~inf) -> (0~1)
      // // TODO getting inputs for color transition?
      // const ex = Math.exp(x / 10);
      // const t = ex / (5 + ex);

      // iterate and find the two colors
      let lo: number[] = [0,0,0];
      let hi: number[] = [0,0,0];
      let mx: number = -1000;
      let mn: number = -1000;
      for (let entry of Array.from(cst.DIRT_COLORS)) {
        lo = hi;
        hi = entry[1];
        mn = mx;
        mx = entry[0];
        if (x <= entry[0]) {
          break;
        }
      }
      if (mn === -1000) {
        lo = hi;
        mn = mx;
        mx += 1;
      }

      // convert into range and truncate
      let t = (x - mn) / (mx - mn);
      if (x <= mn) {
        t = 0;
      }
      if (x >= mx) {
        t = 1;
      }

      let now = [0,0,0];
      for(let i=0; i<3; i++) now[i] = (hi[i]-lo[i]) * t + lo[i];

      return `rgb(${now[0]},${now[1]},${now[2]})`;
    }
    
    const getSoupColor = (s: number): string => {
      // TODO is this in right dimention?
      if (s <= 1000)  return 'white';
      if (s <= 10000) return 'yellow';
      return 'orange';
    }

    for (let i = 0; i < width; i++) for (let j = 0; j < height; j++){
      let idxVal = map.getIdx(i,j);
      let plotJ = height-j-1;

      const cx = (minX+i)*scale, cy = (minY+plotJ)*scale;

      this.ctx.fillStyle = 'white';
      this.ctx.globalAlpha = 1;


      if (dirtLayer) {// && (map.dirt[idxVal] > 0)) {
        // dirt should be a gradient from green to red depending on elevation
        let thisrgbcolor: string = getDirtColor(map.dirt[idxVal]);
        this.ctx.fillStyle = thisrgbcolor;
      }

      if (waterLayer && (map.flooded[idxVal] > 0)){
        // water should always be the same color
        this.ctx.fillStyle = 'rgb(' + cst.WATER_COLOR.join(',') + ')';
      }

      // water covers dirt; we can fill only once
      this.ctx.fillRect(cx, cy, scale, scale);

      if (pollutionLayer) {
        // pollution should add a clouds that are black with some opacity
        this.ctx.fillStyle = 'black';
        world.calculatePollutionIfNeeded();
        this.ctx.globalAlpha = map.pollution[idxVal] / 10000.0;
        this.ctx.fillRect(cx, cy, scale, scale);
      }

      if (map.soup[idxVal] != 0){
        this.ctx.fillStyle = getSoupColor(map.soup[idxVal]);
        this.ctx.globalAlpha = 1;
        this.ctx.fillRect(cx+scale/3, cy+scale/3, scale/3, scale/3);
      }

      if (this.conf.showGrid) {
        this.ctx.strokeStyle = 'gray';
        this.ctx.globalAlpha = 1;
        this.ctx.strokeRect(cx, cy, scale, scale);
      }
    }

    this.ctx.restore();
  }

  private renderBodies(world: GameWorld, nextStep?: NextStep, lerpAmount?: number) {
    const bodies = world.bodies;
    const length = bodies.length;
    const types = bodies.arrays.type;
    const teams = bodies.arrays.team;
    const cargo = bodies.arrays.cargo;
    const ids = bodies.arrays.id;
    const xs = bodies.arrays.x;
    const ys = bodies.arrays.y;
    const minY = world.minCorner.y;
    const maxY = world.maxCorner.y -1;

    let nextXs: Int32Array, nextYs: Int32Array, realXs: Float32Array, realYs: Float32Array;
    if (nextStep && lerpAmount) {
      // Interpolated (not going to happen in 2019)
      nextXs = nextStep.bodies.arrays.x;
      nextYs = nextStep.bodies.arrays.y;
      lerpAmount = lerpAmount || 0;
    }
    else{
      // supposed to be error?
      // console.log("Error in renderer.ts");
      // return;
    }

    // Calculate the real xs and ys
    realXs = new Float32Array(length)
    realYs = new Float32Array(length)
    for (let i = 0; i < length; i++) {
      if (nextStep && lerpAmount) {
        // Interpolated
        // @ts-ignore
        realXs[i] = xs[i] + (nextXs[i] - xs[i]) * lerpAmount;
        // @ts-ignore
        realYs[i] = this.flip(ys[i] + (nextYs[i] - ys[i]) * lerpAmount, minY, maxY);
      } else {
        // Not interpolated
        realXs[i] = xs[i];
        realYs[i] = this.flip(ys[i], minY, maxY);
      }
    }

    // Render the robots
    // render drones last to have them be on top of other units.
    let droneIndices = new Array<number>();
    for (let i = 0; i < length; i++) {
      const team = teams[i];
      const type = types[i];
      const x = realXs[i];
      const y = realYs[i];

      let img = this.imgs.cow;

      if (type !== cst.COW) {
        let tmp = this.imgs.robot[cst.bodyTypeToString(type)];
        // TODO how to change drone?
        if(type == cst.DRONE){
          // tmp = (cargo[i]!=0 ? tmp.carry : tmp.empty);
          droneIndices.push(i);
          continue;
        }
        img = tmp[team];
      }
      // this.drawCircleBot(x, y, radius);
      // this.drawImage(img, x, y, radius);
      this.drawBot(img, x, y);
      
      // Draw the sight radius if the robot is selected
      if (type !== cst.COW && (this.lastSelectedID === undefined || ids[i] === this.lastSelectedID)) {
        this.drawSightRadii(x, y, type, ids[i] === this.lastSelectedID);
      }
    }
    // draw all drones last
    for (let j = 0; j < droneIndices.length; j++) {
      let i = droneIndices[j];
      const team = teams[i];
      const type = types[i];
      const x = realXs[i];
      const y = realYs[i];

      let tmp = this.imgs.robot[cst.bodyTypeToString(type)].empty;

      const img = tmp[team];
      this.drawBot(img, x, y);
      
      // Draw the sight radius if the robot is selected
      if (this.lastSelectedID === undefined || ids[i] === this.lastSelectedID) {
        this.drawSightRadii(x, y, type, ids[i] === this.lastSelectedID);
      }
    }

    this.setInfoStringEvent(world, xs, ys);
  }

  /**
   * Returns the mirrored y coordinate to be consistent with (0, 0) in the
   * bottom-left corner (top-left corner is canvas default).
   * params: y coordinate to flip
   *         yMin coordinate of the minimum edge
   *         yMax coordinate of the maximum edge
   */
  private flip(y: number, yMin: number, yMax: number) {
    return yMin + yMax - y;
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
   * Draws a circular outline representing the sight radius or bullet sight
   * radius of the given robot type, centered at (x, y)
   */
  private drawSightRadii(x: number, y: number, type: schema.BodyType, single?: Boolean) {
    if (type === cst.COW) {
      return; // cows can't see...
    }

    if (this.conf.sightRadius || single) {
      const sightRadiusSquared = this.metadata.types[type].sensorRadiusSquared;
      const sightRadius = Math.sqrt(sightRadiusSquared);
      this.ctx.beginPath();
      this.ctx.arc(x+0.5, y+0.5, sightRadius, 0, 2 * Math.PI);
      this.ctx.strokeStyle = "#46ff00";
      this.ctx.lineWidth = cst.SIGHT_RADIUS_LINE_WIDTH;
      this.ctx.stroke();
    } else {
      // console.log("drawSightRadii called, but should not draw it");
    }

  }

  /**
   * Draws an image centered at (x, y) with the given radius
   */
  private drawImage(img: HTMLImageElement, x: number, y: number, radius: number) {
    this.ctx.drawImage(img, x-radius, y-radius, radius*2, radius*2);
  }

  /**
   * Draws a bot at (x, y)
   */
  private drawBot(img: HTMLImageElement, x: number, y: number) {
    this.ctx.drawImage(img, x, y, 1, 1);
  }

  private setInfoStringEvent(world: GameWorld,
    xs: Int32Array, ys: Int32Array) {
    // world information
    const width = world.maxCorner.x - world.minCorner.x;
    const height = world.maxCorner.y - world.minCorner.y;
    const ids: Int32Array = world.bodies.arrays.id;
    // TODO: why is this Int8Array and not Int32Array?
    const types: Int8Array = world.bodies.arrays.type;
    // const radii: Float32Array = world.bodies.arrays.radius;
    const onRobotSelected = this.onRobotSelected;

    this.canvas.onmousedown = (event: MouseEvent) => {
      const {x, y} = this.getIntegerLocation(event, world);

      // Get the ID of the selected robot
      let selectedRobotID;
      let possibleDroneID: number | undefined = undefined;
      for (let i in ids) {
        if (xs[i] == x && ys[i] == y) {
          selectedRobotID = ids[i];
          if(world.bodies.arrays.type[i] == cst.DRONE)
            possibleDroneID = ids[i];
        }
      }

      // if there are two robots in same cell, choose the drone
      if(possibleDroneID != undefined) selectedRobotID = possibleDroneID;
      // Set the info string even if the robot is undefined
      this.lastSelectedID = selectedRobotID;
      onRobotSelected(selectedRobotID);
    };
  }

  private setMouseoverEvent(world: GameWorld) {
    // world information
    // const width = world.maxCorner.x - world.minCorner.x;
    // const height = world.maxCorner.y - world.minCorner.y;
    const onMouseover = this.onMouseover;
    // const minY = world.minCorner.y;
    // const maxY = world.maxCorner.y - 1;

    this.canvas.onmousemove = (event) => {
      // const x = width * event.offsetX / this.canvas.offsetWidth + world.minCorner.x;
      // const _y = height * event.offsetY / this.canvas.offsetHeight + world.minCorner.y;
      // const y = this.flip(_y, minY, maxY)

      // Set the location of the mouseover
      const {x, y} = this.getIntegerLocation(event, world);
      const idx = world.mapStats.getIdx(x, y);
      world.calculatePollutionIfNeeded();
      onMouseover(x, y, world.mapStats.dirt[idx], world.mapStats.flooded[idx], world.mapStats.pollution[idx], world.mapStats.soup[idx]);
    };
  }

  private getIntegerLocation(event: MouseEvent, world: GameWorld) {
    const width = world.maxCorner.x - world.minCorner.x;
    const height = world.maxCorner.y - world.minCorner.y;
    const minY = world.minCorner.y;
    const maxY = world.maxCorner.y - 1;
    const x = width * event.offsetX / this.canvas.offsetWidth + world.minCorner.x;
    const _y = height * event.offsetY / this.canvas.offsetHeight + world.minCorner.y;
    const y = this.flip(_y, minY, maxY)
    return {x: Math.floor(x), y: Math.floor(y+1)};
  }

  private renderNetGunShots(world: GameWorld) {
    const lines = world.netGunShots;
    const minY = world.minCorner.y;
    const maxY = world.maxCorner.y - 1;
    
    const linesID = lines.arrays.id;
    const linesStartX = lines.arrays.startX;
    const linesStartY = lines.arrays.startY;
    const linesEndX = lines.arrays.endX;
    const linesEndY = lines.arrays.endY;
    this.ctx.lineWidth = 0.2;

    for (let i = 0; i < lines.length; i++) {
      if (this.lastSelectedID === undefined || linesID[i] === this.lastSelectedID) {
        const startX = linesStartX[i]+0.5;
        const startY = this.flip(linesStartY[i], minY, maxY)+0.5;
        const endX = linesEndX[i]+0.5;
        const endY = this.flip(linesEndY[i], minY, maxY)+0.5;

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = `rgb(0,247,255)`;
        this.ctx.stroke();
      }
    }
  }

  private renderIndicatorDotsLines(world: GameWorld) {
    if (!this.conf.indicators) {
      return;
    }

    const dots = world.indicatorDots;
    const lines = world.indicatorLines;

    // Render the indicator dots
    const dotsID = dots.arrays.id;
    const dotsX = dots.arrays.x;
    const dotsY = dots.arrays.y;
    const dotsRed = dots.arrays.red;
    const dotsGreen = dots.arrays.green;
    const dotsBlue = dots.arrays.blue;
    const minY = world.minCorner.y;
    const maxY = world.maxCorner.y - 1;

    for (let i = 0; i < dots.length; i++) {
      if (this.lastSelectedID === undefined || dotsID[i] === this.lastSelectedID) {
        const red = dotsRed[i];
        const green = dotsGreen[i];
        const blue = dotsBlue[i];
        const x = dotsX[i];
        const y = this.flip(dotsY[i], minY, maxY);

        this.ctx.beginPath();
        this.ctx.arc(x+0.5, y+0.5, cst.INDICATOR_DOT_SIZE, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        this.ctx.fill();
      }
    }

    // Render the indicator lines
    const linesID = lines.arrays.id;
    const linesStartX = lines.arrays.startX;
    const linesStartY = lines.arrays.startY;
    const linesEndX = lines.arrays.endX;
    const linesEndY = lines.arrays.endY;
    const linesRed = lines.arrays.red;
    const linesGreen = lines.arrays.green;
    const linesBlue = lines.arrays.blue;
    this.ctx.lineWidth = cst.INDICATOR_LINE_WIDTH;

    for (let i = 0; i < lines.length; i++) {
      if (this.lastSelectedID === undefined || linesID[i] === this.lastSelectedID) {
        const red = linesRed[i];
        const green = linesGreen[i];
        const blue = linesBlue[i];
        const startX = linesStartX[i]+0.5;
        const startY = this.flip(linesStartY[i], minY, maxY)+0.5;
        const endX = linesEndX[i]+0.5;
        const endY = this.flip(linesEndY[i], minY, maxY)+0.5;

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
        this.ctx.stroke();
      }
    }
  }
}
