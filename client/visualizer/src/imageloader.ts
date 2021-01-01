import {Config} from './config';
type Image = HTMLImageElement;

export type AllImages = {
  tiles: {
    dirt: Image,
    swamp: Image
  },
  robots: {
    enlightmentCenter: Array<Image>,
    politician: Array<Image>,
    muckraker: Array<Image>,
    slanderer: Array<Image>
  },
  effects: { // TODO
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
    goEnd: Image
  }
};

export function loadAll(config: Config, callback: (arg0: AllImages) => void) {
  const dirname = "./static/img/";
  const RED: number = 1;
  const BLU: number = 2;

  function loadImage(obj, slot, path) : void {
    this.expected++;
    const image = new Image();

    function onFinish(){
      if(this.requestedAll && this.expected == this.success + this.failure){
        console.log(`Image loaded: ${this.success} successful, ${this.failure} failed. Total ${this.expected}.`);
        callback((Object.freeze(result) as unknown) as AllImages);
      }
    }

    image.onload = () => {
      obj[slot] = image;
      this.success++;
      onFinish();
    };

    image.onerror = () => {
      obj[slot] = image;
      this.failure++;
      console.error(`CANNOT LOAD IMAGE: ${slot}, ${path}, ${image}`);
      onFinish();
    }

    // might want to use path library
    image.src = require(dirname + path).default;
  }
  loadImage.expected = 0;
  loadImage.success = 0;
  loadImage.failure = 0;
  loadImage.requestedAll = false;

  const result = {
    tiles: {
      dirt: null,
      swamp: null
    },
    robots: {
      enlightmentCenter: [],
      politician: [],
      muckraker: [],
      slanderer: [],
    },
    effects: {},
    controls: {
      goNext: null,
      goPrevious: null,
      playbackPause: null,
      playbackStart: null,
      playbackStop: null,
      matchForward: null,
      matchBackward: null,
      reverseUPS: null,
      doubleUPS: null,
      halveUPS: null,
      goEnd: null
    }
  };

  // terrain tiles
  loadImage(result.tiles, 'dirt', 'tiles/DirtTerrain.png');
  loadImage(result.tiles, 'swamp', 'tiles/SwampTerrain.png');

  // robot sprites
  loadImage(result.robots.enlightmentCenter, RED, 'sprites/center_red.png');
  loadImage(result.robots.muckraker, RED, 'sprites/muck_red.png');
  loadImage(result.robots.politician, RED, 'sprites/polit_red.png');
  loadImage(result.robots.slanderer, RED, 'sprites/slanderer_red.png');

  loadImage(result.robots.enlightmentCenter, BLU, 'sprites/center_blue.png');
  loadImage(result.robots.muckraker, BLU, 'sprites/muck_blue.png');
  loadImage(result.robots.politician, BLU, 'sprites/polit_blue.png');
  loadImage(result.robots.slanderer, BLU, 'sprites/slanderer_blue.png');

  // TODO: effects

  // buttons are from https://material.io/resources/icons
  loadImage(result.controls, 'goNext', 'controls/go-next.png');
  loadImage(result.controls, 'goPrevious', 'controls/go-previous.png');
  loadImage(result.controls, 'playbackPause', 'controls/playback-pause.png');
  loadImage(result.controls, 'playbackStart', 'controls/playback-start.png');
  loadImage(result.controls, 'playbackStop', 'controls/playback-stop.png');
  loadImage(result.controls, 'reverseUPS', 'controls/reverse.png');
  loadImage(result.controls, 'doubleUPS', 'controls/skip-forward.png');
  loadImage(result.controls, 'halveUPS', 'controls/skip-backward.png');
  loadImage(result.controls, 'goEnd', 'controls/go-end.png');

  loadImage(result.controls, 'matchBackward', 'controls/green-previous.png');
  loadImage(result.controls, 'matchForward', 'controls/green-next.png');
  
  // mark as finished
  loadImage.requestedAll = true;
}


