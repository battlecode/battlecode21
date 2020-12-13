/**
 * The entrypoint to the battlecode client.
*/

import { schema, flatbuffers } from 'battlecode-playback';
import * as cst from './constants';
import * as config from './config';
import * as imageloader from './imageloader';

import Sidebar from './main/sidebar';
import Controls from './main/controls';

import { Stats, Console, MatchQueue, Profiler } from './sidebar/index';
import { GameArea } from './gamearea/index';
import { MapEditor } from './mapeditor/index';

import WebSocketListener from './main/websocket';
import ScaffoldCommunicator from './main/scaffold';

import Runner from './runner';

// import TeamStats = gameworld.TeamStats;

// webpack magic
// this loads the stylesheet and injects it into the dom
require('./static/css/style.css');
require('./static/css/tournament.css');

/*
 * We "mount" the Client at a particular HTMLElement - everything we create
 * on the page will live as a child of that element. 
 * 
 * The web page can use to talk to the running client.
 * It can pause it, make it switch matches, etc.
 *
 * This architecture makes it easy to reuse the client on different web pages.
*/
window['battlecode'] = {
  mount: (root: HTMLElement, conf?: any): Client =>
    new Client(root, conf),
  schema: schema,
  flatbuffers: flatbuffers
};

/*
 * Loads resources and initializes controls, sidebar, game area, scaffold, and the runner.
*/
export default class Client {
  private conf: config.Config;
  readonly root: HTMLElement;
  readonly ctx: CanvasRenderingContext2D;

  // HTML components
  imgs: imageloader.AllImages;
  controls: Controls; // Upper controls bar
  sidebar: Sidebar; // Sidebar
  stats: Stats;
  mapeditor: MapEditor;
  gamearea: GameArea; // Inner game area
  console: Console; // Console to display logs
  profiler: Profiler;
  gamecanvas: HTMLCanvasElement;
  mapcanvas: HTMLCanvasElement;
  matchqueue: MatchQueue; // Match queue  

  runner: Runner;

  // Allow us to run matches
  scaffold: ScaffoldCommunicator | null;


  constructor(root: HTMLElement, conf?: any) {
    console.log('Battlecode client loading...');

    this.root = root;
    this.root.id = "root";
    this.conf = config.defaults(conf);

    imageloader.loadAll(conf, (images: imageloader.AllImages) => {
      this.imgs = images;
      this.runner = new Runner(this.root, this.conf, this.imgs);
      this.root.appendChild(this.loadControls());
      this.root.appendChild(this.loadSidebar());
      this.root.appendChild(this.loadGameArea());
      this.loadScaffold();
      this.runner.ready(this.controls, this.stats, this.gamearea, this.console, this.matchqueue);
    });
  }

  /**
  * Keep these for now in case they were needed for anything. They didn't really work when called externally, so they probably weren't.
  */
  setGame(game: number) {
    this.runner.setGame(game);
  }

  setMatch(match: number) {
    this.runner.setMatch(match);
  }

  clearScreen() {
    if (this.runner.looper) this.runner.looper.clearScreen();
  }

  /**
   * Loads control bar and timeline
   */
  private loadControls() {
    this.controls = new Controls(this.conf, this.imgs, this.runner);
    return this.controls.div;
  }

  /**
   * Loads stats bar with team information
   */
  private loadSidebar() {
    let onkeydownControls = (event: KeyboardEvent) => {
      switch (event.keyCode) {
        case 80: // "p" - Pause/Unpause
          this.controls.pause();
          break;
        case 79: // "o" - Stop
          this.controls.stop();
          break;
      }
    };
    this.sidebar = new Sidebar(this.conf, this.imgs, this.runner, onkeydownControls);
    this.stats = this.sidebar.stats;
    this.console = this.sidebar.console;
    this.mapeditor = this.sidebar.mapeditor;
    this.matchqueue = this.sidebar.matchqueue;
    this.profiler = this.sidebar.profiler;
    return this.sidebar.div;
  }

  /**
   * Loads canvas to display game world.
   */
  private loadGameArea() {
    this.gamearea = new GameArea(this.conf, this.imgs, this.mapeditor.canvas, this.profiler.iframe);
    this.sidebar.cb = () => {
      this.gamearea.setCanvas();
      this.controls.setControls();
    };

    return this.gamearea.div;
  }

  /**
   * Find a scaffold to run matches with.
   */
  private loadScaffold() {
    console.log('ELECTRON: ' + process.env.ELECTRON);
    if (process.env.ELECTRON) {
      const scaffoldPath = ScaffoldCommunicator.findDefaultScaffoldPath();

      if (scaffoldPath != null) {
        this.scaffold = new ScaffoldCommunicator(scaffoldPath);
        this.sidebar.addScaffold(this.scaffold);
      } else {
        console.log("Couldn't load scaffold: click \"Queue\" to learn more.");
      }
    }
  }
}
