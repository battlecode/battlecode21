import {Config, Mode} from '../config';
import {AllImages} from '../main/imageloader';
import Client from '../app';

import {GameWorld} from 'battlecode-playback';

import {http} from '../main/electron-modules';

export default class GameArea {

  // HTML elements
  private readonly images: AllImages;
  readonly div: HTMLDivElement;
  readonly canvas: HTMLCanvasElement;
  readonly splashDiv: HTMLDivElement;
  private readonly wrapper: HTMLDivElement;
  private readonly mapEditorCanvas: HTMLCanvasElement;
  private readonly profilerIFrame: HTMLIFrameElement;

  // Options
  private readonly conf: Config;

  constructor(conf: Config, images: AllImages, mapEditorCanvas: HTMLCanvasElement, profilerIFrame: HTMLIFrameElement) {
    this.div = document.createElement("div");
    this.div.id = "gamearea";
    this.conf = conf;
    this.images = images;
    this.mapEditorCanvas = mapEditorCanvas;
    this.profilerIFrame = profilerIFrame;

    // Create the canvas
    const wrapper: HTMLDivElement = document.createElement("div");
    wrapper.id = "canvas-wrapper";
    this.wrapper = wrapper;

    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.id = "battlecode-canvas";
    this.canvas = canvas;
    
    this.splashDiv = document.createElement("div");
    this.splashDiv.id = "battlecode-splash";
    this.loadSplashDiv();

    // Add elements to the main div
    this.div.appendChild(this.wrapper);
  }

  /**
   * Sets canvas size to maximum dimensions while maintaining the aspect ratio
   */
  setCanvasDimensions(world: GameWorld): void {
    const scale: number = 30; // arbitrary scaling factor

    this.canvas.width = world.minCorner.absDistanceX(world.maxCorner) * scale;
    this.canvas.height = world.minCorner.absDistanceY(world.maxCorner) * scale;

  }
  
  /**
   * Displays the splash screen
   */
  loadSplashDiv() {
    
    let splashTitle = document.createElement("h1");
    splashTitle.id = "splashTitle";
    splashTitle.appendChild(document.createTextNode("Battlecode 2020 Client"));
    this.splashDiv.appendChild(splashTitle);
    
    let splashSubtitle = document.createElement("h3");
    splashSubtitle.id = "splashSubtitle";
    splashSubtitle.appendChild(document.createTextNode("v" + this.conf.gameVersion));
    this.splashDiv.appendChild(splashSubtitle);
    
    if (process.env.ELECTRON) {
      (async function (splashDiv, version) {
      
        var options = {
          host: '2020.battlecode.org',
          path: '/version.txt'
        };

        var req = http.get(options, function(res) {
          let data = "";
          res.on('data', function(chunk) {
            data += chunk
          }).on('end', function() {
            
            var latest = data;

            if(latest.trim() != version.trim()) {
              let newVersion = document.createElement("p");
              newVersion.id = "splashNewVersion";
              newVersion.innerHTML = "New version available (download with <code>gradle update</code> followed by <code>gradle build</code>, and then restart the client): v" + latest;
              splashDiv.appendChild(newVersion);
            }

          })
        });
      })(this.splashDiv, this.conf.gameVersion);
    }
  }

  /**
   * Displays the correct canvas depending on whether we are in game mode
   * or map editor mode
   */
  setCanvas() {
    var mode = this.conf.mode;
    // haHAA 
    var splash = this.conf.splash && mode !== Mode.MAPEDITOR && mode !== Mode.PROFILER;

    // The canvas can be anything in help mode
    if (mode === Mode.HELP) return;

    // Otherwise clear the canvas area...
    while(this.wrapper.firstChild) {
      this.wrapper.removeChild(this.wrapper.firstChild);
    }
    this.splashDiv.remove();

    // ...and add the correct one
    var shouldListen = true;
    if (splash) {
      shouldListen = false;
      this.div.appendChild(this.splashDiv);

      // Reset change listeners
      window.onresize = function() {};
    } else {
      switch (mode) {
        case Mode.MAPEDITOR:
          this.wrapper.appendChild(this.mapEditorCanvas);
          break;
        case Mode.PROFILER:
          this.wrapper.appendChild(this.profilerIFrame);
          break;
        default:
          this.wrapper.appendChild(this.canvas); // TODO: Only append if a game is available in client.games
          console.log("Now a game");
      }
    }
    
    if(shouldListen) {
      window.onresize = function() {
        var wrapper = <HTMLDivElement> document.getElementById("canvas-wrapper");
        var splash = <HTMLDivElement> document.getElementById("battlecode-splash");
        if(wrapper.firstChild && splash) {
          var currentCanvas = <HTMLCanvasElement> wrapper.firstChild;
          
          // This part is nasty, but handles the case where no game is in the canvas
          // If the map dimensions just so happen to equal these parameters, this will
          // still have the desired effect, as the client does not show with a map of
          // that size
          if(currentCanvas.clientHeight != 150 && currentCanvas.clientWidth != 300) {
            splash.style.maxHeight = "" + currentCanvas.clientHeight + "px";
            splash.style.maxWidth = "" + currentCanvas.clientWidth + "px";
          } else {
            splash.style.maxHeight = "";
            splash.style.maxWidth = "";
          }
        }
      };
    }
    
    // Reset splash size and reconfigure
    this.splashDiv.style.maxHeight = "";
    this.splashDiv.style.maxWidth = "";
    window.dispatchEvent(new Event('resize'));
  };
}
