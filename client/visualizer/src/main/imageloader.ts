import {Config} from '../config';
import { type } from 'os';

type Image = HTMLImageElement;


export type AllImages = {
  background: Image, 
  star: Image,
  soup: Image,
  cow: Image,
  robot: {
    netGun: Array<Image>,
    landscaper: Array<Image>,
    miner: Array<Image>,
    fulfillmentCenter: Array<Image>,
    drone: {
      empty: Array<Image>,
      carry: Array<Image>
    }
    designSchool: Array<Image>,
    refinery: Array<Image>,
    HQ: Array<Image>,
    vaporator: Array<Image>
  },
  controls: {
    goNext: Image,
    goPrevious: Image,
    playbackPause: Image,
    playbackStart: Image,
    playbackStop: Image,
    matchForward: Image,
    matchBackward: Image,
    reverseUPS: Image,
    doubleUPS: Image,
    halveUPS: Image,
  }
};

export function loadAll(config: Config, finished: (AllImages) => void) {
  let expected = 0, loaded = 0;
  let result: any = {
    robot: {
      netGun: [],
      landscaper: [],
      miner: [],
      fulfillmentCenter: [],
      drone: {empty: [], carry: []},
      designSchool: [],
      refinery: [],
      vaporator: [],
      HQ: []
    },
    controls: {}
  };

  // write loaded image to obj[slot]
  function img(obj, slot, url) {
    // we expect another one
    expected++;
    let image = new Image();
    image.onload = () => {
      obj[slot] = image;
      // hey, we found it
      loaded++;
      if (loaded === expected) {
        console.log('All images loaded.');
        finished(Object.freeze(result) as AllImages);
      }
    };
    image.onerror = () => {
      loaded++;
      console.log(`CANNOT LOAD IMAGE: ${slot}, ${url}, ${image}`);
      if (loaded === expected) {
        console.log('All images loaded.');
        finished(Object.freeze(result) as AllImages);
      }
    }
    image.src = url.default;
  }

  const dirname = "./static/img/";
  const RED: number = 1;
  const BLU: number = 2;

  img(result, 'background', require(dirname + 'map/tiled_1.jpg'));
  img(result, 'unknown', require(dirname + 'sprites/unknown.png'));
  img(result, 'star', require(dirname + 'yellow_star.png'));
  img(result, 'soup', require(dirname + 'soup.png'));
  img(result, 'cow', require(dirname + 'sprites/Cow.png'));


  // these are the teams we expect robots to be in according to current
  // battlecode-server
  // TODO(jhgilles):
  // we'll need to update them if team configuration becomes more dynamic
  img(result.robot.drone.empty, RED, require(dirname + 'sprites/Drone_red.png'));
  img(result.robot.drone.empty, BLU, require(dirname + 'sprites/Drone_blue.png'));
  img(result.robot.drone.carry, RED, require(dirname + 'sprites/Drone_red_carry.png'));
  img(result.robot.drone.carry, BLU, require(dirname + 'sprites/Drone_blue_carry.png'));

  img(result.robot.netGun, RED, require(dirname + 'sprites/Net_gun_red.png'));
  img(result.robot.netGun, BLU, require(dirname + 'sprites/Net_gun_blue.png'));
  
  img(result.robot.landscaper, RED, require(dirname + 'sprites/Landscaper_red.png'));
  img(result.robot.landscaper, BLU, require(dirname + 'sprites/Landscaper_blue.png'));
  
  img(result.robot.miner, RED, require(dirname + 'sprites/Miner_red.png'));
  img(result.robot.miner, BLU, require(dirname + 'sprites/Miner_blue.png'));
  
  img(result.robot.fulfillmentCenter, RED, require(dirname + 'sprites/Fulfillment_red.png'));
  img(result.robot.fulfillmentCenter, BLU, require(dirname + 'sprites/Fulfillment_blue.png'));
  
  img(result.robot.designSchool, RED, require(dirname + 'sprites/SOUPER_red.png'));
  img(result.robot.designSchool, BLU, require(dirname + 'sprites/SOUPER_blue.png'));
  
  img(result.robot.refinery, RED, require(dirname + 'sprites/Refinery_red.png'));
  img(result.robot.refinery, BLU, require(dirname + 'sprites/Refinery_blue.png'));
  
  img(result.robot.vaporator, RED, require(dirname + 'sprites/Vaporator_red.png'));
  img(result.robot.vaporator, BLU, require(dirname + 'sprites/Vaporator_blue.png'));
  
  img(result.robot.HQ, RED, require(dirname + 'sprites/HQ_red.png'));
  img(result.robot.HQ, BLU, require(dirname + 'sprites/HQ_blue.png'));
  

  // Buttons are from https://material.io/resources/icons
  img(result.controls, 'goNext', require(dirname + 'controls/go-next.png'));
  img(result.controls, 'goPrevious', require(dirname + 'controls/go-previous.png'));
  img(result.controls, 'playbackPause', require(dirname + 'controls/playback-pause.png'));
  img(result.controls, 'playbackStart', require(dirname + 'controls/playback-start.png'));
  img(result.controls, 'playbackStop', require(dirname + 'controls/playback-stop.png'));
  img(result.controls, 'reverseUPS', require(dirname + 'controls/reverse.png'));
  img(result.controls, 'doubleUPS', require(dirname + 'controls/skip-forward.png'));
  img(result.controls, 'halveUPS', require(dirname + 'controls/skip-backward.png'));

  img(result.controls, 'matchBackward', require(dirname + 'controls/green-previous.png'));
  img(result.controls, 'matchForward', require(dirname + 'controls/green-next.png'));
}


