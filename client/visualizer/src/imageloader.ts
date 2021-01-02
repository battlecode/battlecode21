import {Config} from './config';
type Image = HTMLImageElement;

export type AllImages = {
  star: Image,
  tiles: {
    dirt: Image,
    swamp: Image
  },
  robots: {
    enlightenmentCenter: Array<Image>,
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

  const NEUTRAL: number = 0;
  const RED: number = 1;
  const BLU: number = 2;

  function loadImage(obj, slot, path) : void {
    const f = loadImage;
    f.expected++;
    const image = new Image();

    function onFinish(){
      if(f.requestedAll && f.expected == f.success + f.failure){
        console.log(`Total ${f.expected} images loaded: ${f.success} successful, ${f.failure} failed.`);
        callback((Object.freeze(result) as unknown) as AllImages);
      }
    }

    image.onload = () => {
      obj[slot] = image;
      f.success++;
      onFinish();
    };

    image.onerror = () => {
      obj[slot] = image;
      f.failure++;
      console.error(`CANNOT LOAD IMAGE: ${slot}, ${path}, ${image}`);
      onFinish();
    }

    // might want to use path library
    // webpack url loader triggers on require("<path>.png"), so .png should be explicit
    image.src = require(dirname + path + '.png').default;
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
      enlightenmentCenter: [],
      politician: [],
      muckraker: [],
      slanderer: [],
    },
    effects: {
      death: [],
      embezzle: [],
      empower: [],
      expose: []
    },
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

  loadImage(result, 'star', 'star');

  // terrain tiles
  loadImage(result.tiles, 'dirt', 'tiles/DirtTerrain');
  loadImage(result.tiles, 'swamp', 'tiles/SwampTerrain');

  // robot sprites
  loadImage(result.robots.enlightenmentCenter, RED, 'robots/center_red');
  loadImage(result.robots.muckraker, RED, 'robots/muck_red');
  loadImage(result.robots.politician, RED, 'robots/polit_red');
  loadImage(result.robots.slanderer, RED, 'robots/slanderer_red');

  loadImage(result.robots.enlightenmentCenter, BLU, 'robots/center_blue');
  loadImage(result.robots.muckraker, BLU, 'robots/muck_blue');
  loadImage(result.robots.politician, BLU, 'robots/polit_blue');
  loadImage(result.robots.slanderer, BLU, 'robots/slanderer_blue');

  loadImage(result.robots.enlightenmentCenter, NEUTRAL, 'robots/center');

  // effects

  loadImage(result.effects.death, 1, 'effects/death/death_empty');

  loadImage(result.effects.embezzle, 1, 'effects/embezzle/slanderer_embezzle_empty_1');
  loadImage(result.effects.embezzle, 2, 'effects/embezzle/slanderer_embezzle_empty_2');

  loadImage(result.effects.empower, 1, 'effects/empower/polit_empower_empty_1');
  loadImage(result.effects.empower, 2, 'effects/empower/polit_empower_empty_2');

  loadImage(result.effects.expose, 1, 'effects/expose/expose_empty');

  // buttons are from https://material.io/resources/icons
  loadImage(result.controls, 'goNext', 'controls/go-next');
  loadImage(result.controls, 'goPrevious', 'controls/go-previous');
  loadImage(result.controls, 'playbackPause', 'controls/playback-pause');
  loadImage(result.controls, 'playbackStart', 'controls/playback-start');
  loadImage(result.controls, 'playbackStop', 'controls/playback-stop');
  loadImage(result.controls, 'reverseUPS', 'controls/reverse');
  loadImage(result.controls, 'doubleUPS', 'controls/skip-forward');
  loadImage(result.controls, 'halveUPS', 'controls/skip-backward');
  loadImage(result.controls, 'goEnd', 'controls/go-end');

  loadImage(result.controls, 'matchBackward', 'controls/green-previous');
  loadImage(result.controls, 'matchForward', 'controls/green-next');
  
  // mark as finished
  loadImage.requestedAll = true;
}


