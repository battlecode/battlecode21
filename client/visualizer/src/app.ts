import {Game, GameWorld, Match, Metadata, schema, flatbuffers} from 'battlecode-playback';
import * as cst from './constants';
import * as config from './config';
import * as imageloader from './main/imageloader';

import Sidebar from './main/sidebar';
import Controls from './main/controls';
import Splash from './main/splash';

import {Stats, Console, MatchQueue, Profiler} from './sidebar/index';
import {GameArea, Renderer, NextStep, TickCounter} from './gamearea/index';
import {MapEditor} from './mapeditor/index';

import WebSocketListener from './main/websocket';
import ScaffoldCommunicator from './main/scaffold';

import { electron } from './main/electron-modules';
import { TeamStats } from 'battlecode-playback/out/gameworld';

import {Tournament, readTournament} from './main/tournament';

// import TeamStats = gameworld.TeamStats;

// webpack magic
// this loads the stylesheet and injects it into the dom
require('./static/css/style.css');
require('./static/css/tournament.css');

// open devtools on f12
document.addEventListener("keydown", function (e) {
  if (e.which === 123) {
    electron.remote.getCurrentWindow().webContents.openDevTools();
  }
});

/**
 * The entrypoint to the battlecode client.
 *
 * We "mount" the application at a particular HTMLElement - everything we create
 * on the page will live as a child of that element.
 *
 * We return a Client, which the web page can use to talk to the running client.
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

/**
 * The interface a web page uses to talk to a client.
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

  // Match logic
  listener: WebSocketListener | null;

  games: Game[];

  tournament?: Tournament;
  tournamentState: TournamentState;

  currentGame: number | null;
  currentMatch: number | null;

  // used to cancel the main loop
  loopID: number | null;

  // Allow us to run matches
  scaffold: ScaffoldCommunicator | null;

  constructor(root: HTMLElement, conf?: any) {
    console.log('Battlecode client loading...');

    this.root = root;
    this.root.id = "root";
    this.conf = config.defaults(conf);

    imageloader.loadAll(conf, (images: imageloader.AllImages) => {
      this.imgs = images;
      this.root.appendChild(this.loadControls());
      this.root.appendChild(this.loadSidebar());
      this.root.appendChild(this.loadGameArea());
      this.loadScaffold();
      this.ready();
    });

    this.games = [];

    // If it's in dev, we're not using server
    if (this.conf.websocketURL !== null && process.env.NODE_ENV !== 'development') {
      this.listener = new WebSocketListener(
        this.conf.websocketURL,
        this.conf.pollEvery
      );
    }
  }

  /**
   * Set the current game.
   */
  setGame(game: number) {
    if (game < 0 || game >= this.games.length) {
      throw new Error(`No game ${game} loaded, only have ${this.games.length} games`);
    }
    this.clearScreen();
    this.currentGame = game;
    this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch ? this.currentMatch: 0);
  }

  setMatch(match: number) {
    const matchCount = this.games[this.currentGame as number].matchCount;
    if (match < 0 || match >= matchCount) {
      throw new Error(`No match ${match} loaded, only have ${matchCount} matches in current game`);
    }
    this.clearScreen();
    this.currentMatch = match;

    // Restart game loop
    this.runMatch();
    this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch);
    this.games[this.currentGame ? this.currentGame: 0].getMatch(this.currentMatch).seek(0);
  }

  /**
   * Loads control bar and timeline
   */
  loadControls() {
    this.controls = new Controls(this.conf, this.imgs);
    return this.controls.div;
  }

  /**
   * Loads stats bar with team information
   */
  loadSidebar() {
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
    this.sidebar = new Sidebar(this.conf, this.imgs, onkeydownControls);
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
  loadGameArea() {
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
  loadScaffold() {
    console.log('ELECTRON: '+process.env.ELECTRON);
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

  /**
   * Marks the client as fully loaded.
   */
  ready() {
    this.gamearea.setCanvas();

    let startGame = () => {
      if (this.games.length === 1) {
        // this will run the first match from the game
        this.setGame(0);
        this.setMatch(0);
      }
      this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch ? this.currentMatch: 0);
    }
    
    let toMain = (msg) => {
      console.log(msg);
      alert('Error occurred. Check console on your browser');
      // window.location.assign('/visualizer.html');
    }

    if (this.conf.matchFileURL) {
      // Load a match file
      console.log(`Loading provided match file: ${this.conf.matchFileURL}`);

      const req = new XMLHttpRequest();
      req.open('GET', this.conf.matchFileURL, true);
      req.responseType = 'arraybuffer';
      req.onerror = (error) => {
        toMain(`Can't load provided match file: ${error}`);
      };

      req.onload = (event) => {
        const resp = req.response;
        if(!resp || req.status !== 200){
          toMain(`Can't load file from URL: invalid URL(${req.status})`);
        }
        else {
          let lastGame = this.games.length
          this.games[lastGame] = new Game();

          try {
            this.games[lastGame].loadFullGameRaw(resp);
          } catch (error) {
            toMain(`Can't get file from URL: ${error}`);
            return;
          }

          console.log('Successfully loaded provided match file');
          startGame();
        }
      };

      req.send();
    }
    // not loading default match file
    // else {
    //   console.log('Starting with a default match file (/client/default.bc20)');
    //   if(_fs.readFile){
    //     _fs.readFile('../default.bc20', (err, data: ArrayBuffer) => {
    //       if(err){
    //         console.log('Error while loading default local file!');
    //         console.log(err);
    //         console.log('Starting without any match files. Please upload via upload button in queue tab of sidebar');
    //         return;
    //       }

    //       let lastGame = this.games.length
    //       this.games[lastGame] = new Game();
    //       // lastGame should be 0?
    //       try {
    //         this.games[lastGame].loadFullGameRaw(data);
    //       } catch (error) {
    //         console.log(`Error occurred! ${error}`);
    //       }

    //       console.log('Running game!');
    //       startGame();
    //     });
    //   }
    // }
    
    this.controls.onGameLoaded = (data: ArrayBuffer) => {
      let lastGame = this.games.length
      this.games[lastGame] = new Game();
      this.games[lastGame].loadFullGameRaw(data);

      startGame();
    };
    this.matchqueue.onGameLoaded = (data: ArrayBuffer) => {
      let lastGame = this.games.length
      this.games[lastGame] = new Game();
      this.games[lastGame].loadFullGameRaw(data);

      startGame();
    };
    this.stats.onGameLoaded = (data: ArrayBuffer) => {
      let lastGame = this.games.length
      this.games[lastGame] = new Game();
      this.games[lastGame].loadFullGameRaw(data);

      startGame();
    };

    if (this.listener != null) {
      this.listener.start(
        // What to do when we get a game from the websocket
        (game) => {
          this.games.push(game);
          this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch ? this.currentMatch: 0);
        },
        // What to do with the websocket's first match in a given game
        () => {
          // switch to running this match 
          this.setGame(this.games.length-1);
          this.setMatch(0);
          this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch ? this.currentMatch: 0);
        },
        // What to do with any other match
        () => {
          this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch ? this.currentMatch: 0);
        }
      );
    }

    this.stats.seekTournament = (num: number) => {
      console.log('seek tournament');
      this.tournament?.seek(num, 0);
      this.updateTournamentState();
    };

    this.stats.onTournamentLoaded = (jsonFile: File) => {
      if (!process.env.ELECTRON) {
        console.error("Can't load tournament outside of electron!");
        return;
      }
      readTournament(jsonFile, (err, tournament) => {
        if (err) {
          console.error(`Can't load tournament: ${err}`);
          return;
        }
        if (tournament) {
          this.tournament = tournament;
          const t = this;
          document.onkeydown = function(event) {
            // TODO: figure out what this is???
            if (document.activeElement == null) {
              throw new Error('idk?????? i dont know what im doing document.actievElement is null??');
            }
            let input = document.activeElement.nodeName == "INPUT";
            if(!input) {
              // TODO after touching viewoption buttons, the input (at least arrow keys) does not work
              console.log(event.keyCode);
              switch (event.keyCode) {
                case 65: // "a" - previous tournament Match
                  t.previousTournamentThing();
                  t.updateTournamentState();
                  break;
                case 68: // 'd' - next tournament match
                  console.log('next tournament d!');
                  t.nextTournamentThing();
                  t.updateTournamentState();
                  break;
              }
            }
            
          };
          // CHOOSE STARTING ROUND?
          tournament.seek(0, 0);
          this.tournamentState = TournamentState.START_SPLASH;
          this.updateTournamentState();
        }
      });
    };
    this.matchqueue.onTournamentLoaded = (jsonFile: File) => {
      if (!process.env.ELECTRON) {
        console.error("Can't load tournament outside of electron!");
        return;
      }
      readTournament(jsonFile, (err, tournament) => {
        if (err) {
          console.error(`Can't load tournament: ${err}`);
          return;
        }
        if (tournament) {
          this.tournament = tournament;
          const t = this;
          document.onkeydown = function(event) {
            // TODO: figure out what this is???
            if (document.activeElement == null) {
              throw new Error('idk?????? i dont know what im doing document.actievElement is null??');
            }
            let input = document.activeElement.nodeName == "INPUT";
            if(!input) {
              // TODO after touching viewoption buttons, the input (at least arrow keys) does not work
              console.log(event.keyCode);
              switch (event.keyCode) {
                case 65: // "a" - previous tournament Match
                  t.previousTournamentThing();
                  t.updateTournamentState();
                  break;
                case 68: // 'd' - next tournament match
                  console.log('next tournament d!');
                  t.nextTournamentThing();
                  t.updateTournamentState();
                  break;
              }
            }
            
          };
          // CHOOSE STARTING ROUND?
          tournament.seek(0, 0);
          this.tournamentState = TournamentState.START_SPLASH;
          this.updateTournamentState();
        }
      });
    };
  }

  clearScreen() {
    // TODO clear screen
    if (this.loopID !== null) {
      window.cancelAnimationFrame(this.loopID);
      this.loopID = null;
    }
  }

  /**
   * Updates the stats bar displaying VP, bullets, and robot counts for each
   * team in the current game world.
   */
  private updateStats(world: GameWorld, meta: Metadata) {
    for (let team in meta.teams) {
      let teamID = meta.teams[team].teamID;
      let teamStats = world.teamStats.get(teamID);

      // TODO: maybe this check isn't needed???
      if (teamStats == undefined) {
        throw new Error("teamStats is undefined??? figure this out NOW")
      }

      // Update the Soup
      this.stats.setSoups(teamID, (teamStats as TeamStats).soup);
      if(teamStats.soup < 0){ console.log("Soup is negative!!!"); }

      this.stats.setWaterLevel(cst.waterLevel(world.turn));

      // Update each robot count
      this.stats.robots.forEach((type: schema.BodyType) => {
        this.stats.setRobotCount(teamID, type, (teamStats as TeamStats).robots[type]);
      });
    }
  }


  private nextTournamentThing() {
    console.log('actually next tournament thing!');
    // either displays a splash screen with who won, or displays the next game
    // activated by some sort of hotkey, ideally
    // so, we can be in a couple of different states
    // either a splash screen is showing, in which case we should display the next game,
    // or a game is showing, in which case we should display either a next game or a splash screen

    if (this.tournament) {
      if (this.tournamentState === TournamentState.START_SPLASH) {
        // transition to mid game
        this.tournamentState = TournamentState.MID_GAME;
      } else if (this.tournamentState === TournamentState.MID_GAME) {
        // go to the next game
        if (this.tournament.hasNext() && !this.tournament.isLastGameInMatch()) {
          this.tournament.next();
        } else {
          // go to end splash
          this.tournamentState = TournamentState.END_SPLASH;
        }
      } else if (this.tournamentState === TournamentState.END_SPLASH) {
        // go to start splash
        // if not ended
        if (this.tournament.hasNext()) {
          this.tournamentState = TournamentState.START_SPLASH;
          this.tournament.next();
        } else {
          console.log("No more tournament games!");
        }
      }
    }
  }
  private previousTournamentThing() {
    // either displays a splash screen with who won, or displays the next game
    // activated by some sort of hotkey, ideally
    // so, we can be in a couple of different states
    // either a splash screen is showing, in which case we should display the next game,
    // or a game is showing, in which case we should display either a next game or a splash screen

    if (this.tournament) {
      if (this.tournamentState === TournamentState.START_SPLASH) {
        // transition to mid game
        if (this.tournament.hasPrev()) {
          this.tournamentState = TournamentState.END_SPLASH;
          this.tournament.prev();
        } else {
          console.log("No previous tournament games!");
        }
      } else if (this.tournamentState === TournamentState.MID_GAME) {
        // go to the previous game
        if (this.tournament.hasPrev() && !this.tournament.isFirstGameInMatch()) {
          this.tournament.prev();
        } else {
          // go to start splash
          this.tournamentState = TournamentState.START_SPLASH;
        }
      } else if (this.tournamentState === TournamentState.END_SPLASH) {
        // go to mid game
        // if not ended
        this.tournamentState = TournamentState.MID_GAME;
      }
    }
  }

  private updateTournamentState() {
    console.log('update tour state!');
    if (this.tournament) {
      console.log('real update tour state!');
      // clear things
      Splash.removeScreen();
      this.clearScreen();
      // simply updates according to the current tournament state
      if (this.tournamentState === TournamentState.START_SPLASH) {
        console.log('go from splash real update tour state!');
        Splash.addScreen(this.conf, this.root, this.tournament.current(), this.tournament.currentMatch(), this.tournament);
      } else if (this.tournamentState === TournamentState.END_SPLASH) {
        Splash.addWinnerScreen(this.conf, this.root, this.tournament, this.tournament.currentMatch());
      } else if (this.tournamentState === TournamentState.MID_GAME) {
        this.tournament.readCurrent((err, data) => {
          if (err) throw err;
          if (!data) throw new Error("No match loaded from tournament?");

          // reset all games so as to save memory
          // because things can be rough otherwise
          this.games.pop();
          this.games = [new Game()];
          this.games[0].loadFullGameRaw(data);
          this.setGame(0);
          this.setMatch(0);
        });
      }
    }
  }



  private runMatch() {
    console.log('Running match.');

    // THIS IS A QUICKFIX FOR CHECKING THAT CURRENTGAME IS NOT NULL
    // TODO: IDEALLY, WE NEED TO FIGURE THIS OUT: CAN CURRENTGAME EVER BE NULL???
    // maybe this is not necessary
    if (this.currentGame === null) {
      throw new Error('this.currentGame is null; something really bad happened!!! figure this out NOW')
    }
    if (this.currentMatch === null) {
      throw new Error('this.currentMatch is null; something really bad happened!!! figure this out NOW')
    }
  
    this.conf.mode = config.Mode.GAME;
    this.conf.splash = false;
    this.gamearea.setCanvas();

    // Cancel previous games if they're running
    this.clearScreen();

    // For convenience
    const game = this.games[this.currentGame as number] as Game;
    const meta = game.meta as Metadata;
    const match = game.getMatch(this.currentMatch as number) as Match;

    // Reset the canvas
    this.gamearea.setCanvasDimensions(match.current);

    // Reset the stats bar
    let teamNames = new Array();
    let teamIDs = new Array();
    for (let team in meta.teams) {
      teamNames.push(meta.teams[team].name);
      teamIDs.push(meta.teams[team].teamID);
    }
    this.stats.initializeGame(teamNames, teamIDs);
    this.console.setLogsRef(match.logs);

    // keep around to avoid reallocating
    const nextStep = new NextStep();

    // Last selected robot ID to display extra info
    const controls = this.controls;
    const cconsole = this.console;
    let lastSelectedID: number | undefined = undefined;
    const onRobotSelected = (id: number | undefined) => {
      lastSelectedID = id;
      this.console.setIDFilter(id);
    };
    const onMouseover = (x: number, y: number, dirt: number, water: number, pollution: number, soup: number) => {
      // Better make tile type and hand that over
      this.controls.setTileInfo(x, y, dirt, water, pollution, soup);
    };

    // Configure renderer for this match
    // (radii, etc. may change between matches)
    const renderer = new Renderer(this.gamearea.canvas, this.imgs,
      this.conf, meta as Metadata, onRobotSelected, onMouseover);

    // How fast the simulation should progress
    let goalUPS = this.controls.getUPS();
    if (this.conf.tournamentMode) {
      goalUPS = 0; // FOR TOURNAMENT
    }

    // A variety of stuff to track how fast the simulation is going
    let rendersPerSecond = new TickCounter(.5, 100);
    let updatesPerSecond = new TickCounter(.5, 100);

    // The current time in the simulation, interpolated between frames
    let interpGameTime = 0;
    // The time of the last frame
    let lastTime: number | null = null;
    let lastTurn: number | null = null;
    // whether we're seeking
    let externalSeek = false;

    this.controls.isPaused = () => {
      return goalUPS === 0;
    }
    this.controls.onTogglePause = () => {
      goalUPS = goalUPS === 0 ? this.controls.getUPS() : 0;
    };
    this.controls.onToggleUPS = () => {
      goalUPS = this.controls.isPaused() ? 0 : this.controls.getUPS();
    };
    this.controls.onSeek = (turn: number) => {
      externalSeek = true;
      match.seek(turn);
      interpGameTime = turn;
    };
    this.controls.onStepForward = () => {
      if(!(goalUPS == 0)) {
        this.controls.pause();
      }
      if (match.current.turn < match['_farthest'].turn) {
        this.controls.onSeek(match.current.turn + 1);
      }
    };
    this.controls.onStepBackward = () => {
      if(!(goalUPS == 0)) {
        this.controls.pause();
      }
      if (match.current.turn > 0) {
        this.controls.onSeek(match.current.turn - 1);
      }
    };
    this.matchqueue.onNextMatch = () => {
      console.log("NEXT MATCH");

      if(this.currentGame as number < 0) {
        return; // Special case when deleting games
      }

      const matchCount = this.games[this.currentGame as number].matchCount;
      if(this.currentMatch as number < matchCount - 1) {
        this.setMatch(this.currentMatch as number + 1);
      } else {
        if(this.currentGame as number < this.games.length - 1) {
          this.setGame(this.currentGame as number + 1);
          this.setMatch(0);
        } else {
          // Do nothing, at the end
        }
      }
    };
    this.matchqueue.onPreviousMatch = () => {
      console.log("PREV MATCH");

      if(this.currentMatch as number > 0) {
        this.setMatch(this.currentMatch as number - 1);
      } else {
        if(this.currentGame as number > 0) {
          this.setGame(this.currentGame as number - 1);
          this.setMatch(this.games[this.currentGame as number].matchCount - 1);
        } else {
          // Do nothing, at the beginning
        }
      }

    };
    this.matchqueue.removeGame = (game: number) => {

      if (game > (this.currentGame as number)) {
        this.games.splice(game, 1);
      } else if (this.currentGame == game) {
        if (game == 0) {
          // if games.length > 1, remove game, set game to 0, set match to 0
          if (this.games.length > 1) {
            this.setGame(0);
            this.setMatch(0);
            this.games.splice(game, 1);
          } else {
            this.games.splice(game, 1);
            this.clearScreen();
            this.currentGame = -1;
            this.currentMatch = 0;
          }
        } else {
          this.setGame(game - 1);
          this.setMatch(0);
          this.games.splice(game, 1);
        }
      } else {
        // remove game, set game to game - 1
        this.games.splice(game, 1);
        this.currentGame = game - 1;
      }
      
      if(this.games.length == 0) {
        this.conf.splash = true;
        this.gamearea.setCanvas();
      }

      this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch ? this.currentMatch : 0);
    };
    this.matchqueue.gotoMatch = (game: number, match: number) => {
      this.setGame(game);
      this.setMatch(match);
    };
    function changeTime(dragEvent: MouseEvent) {
      // jump to a frame when clicking the controls timeline
      let width: number = (<HTMLCanvasElement>this).width;
      let turn: number = dragEvent.offsetX / width * match['_farthest'].turn;
      turn = Math.round(Math.min(match['_farthest'].turn, turn));
      externalSeek = true;
      match.seek(turn);
      interpGameTime = turn;
    }
    this.controls.canvas.addEventListener('click', changeTime);
    this.controls.canvas.onmousedown = function(mousedownevent) {
      this.addEventListener('mousemove', changeTime);
    };
    this.controls.canvas.onmouseup = function(mouseupevent) {
      this.removeEventListener('mousemove', changeTime);
    };

    this.controls.updatePlayPauseButton();

    // set key options
    const conf = this.conf;
    const t = this;
    document.onkeydown = function(event) {

      // TODO: figure out what this is???
      if (document.activeElement == null) {
        throw new Error('idk?????? i dont know what im doing document.actievElement is null??');
      }
      
      let input = document.activeElement.nodeName == "INPUT";
      if(!input) {
        // TODO after touching viewoption buttons, the input (at least arrow keys) does not work
        console.log(event.keyCode);
        switch (event.keyCode) {
          case 80: // "p" - Pause/Unpause
            controls.pause();
            break;
          case 79: // "o" - Stop
            controls.stop();
            break;
          case 37: // "LEFT" - Step Backward
            controls.stepBackward();
            break;
          case 39: // "RIGHT" - Step Forward
            controls.stepForward();
            break;
          case 38: // "UP" - Faster
            controls.doubleUPS();
            break;
          case 40: // "DOWN" - Slower
          controls.halveUPS();
            break;
          case 82: // "r" - reverse UPS
            controls.reverseUPS();
            break;
          case 67: // "c" - Toggle Circle Bots
            conf.circleBots = !conf.circleBots;
            break;
          case 86: // "v" - Toggle Indicator Dots and Lines
            conf.indicators = !conf.indicators;
            break;
          case 66: // "b" - Toggle Interpolation
            conf.interpolate = !conf.interpolate;
            break;
          case 78: // "n" - Toggle sight radius
            conf.sightRadius = !conf.sightRadius;
            break;
          case 71: // "g" - Toogle grid view
            conf.showGrid = !conf.showGrid;
            break;
          case 72: // "h" - Toggle short log header
            conf.shorterLogHeader = !conf.shorterLogHeader;
            cconsole.updateLogHeader();
            break;
          case 65: // "a" - previous tournament Match
            t.previousTournamentThing();
            t.updateTournamentState();
            break;
          case 68: // 'd' - next tournament match
            t.nextTournamentThing();
            t.updateTournamentState();
            break;
        }
      }
      
    };

    // The main update loop
    const loop = (curTime) => {
      let delta = 0;
      if (lastTime === null) {
        // first simulation step
        // do initial stuff?
      } else if (externalSeek) {
        if (match.current.turn === match.seekTo) {
          externalSeek = false;
        }
      } else if (goalUPS < 0 && match.current.turn === 0) {
        this.controls.pause();
      } else if (Math.abs(interpGameTime - match.current.turn) < 10) {
        // only update time if we're not seeking
        delta = goalUPS * (curTime - lastTime) / 1000;
        interpGameTime += delta;

        // tell the simulation to go to our time goal
        match.seek(interpGameTime | 0);
      } if (match['_farthest'].winner !== null && match.current.turn === match['_farthest'].turn && match.current.turn !== 0){
        // Match have ended
        this.controls.onFinish(game);
      }

      // update fps
      rendersPerSecond.update(curTime, 1);
      updatesPerSecond.update(curTime, delta);

      this.controls.setTime(
        match.current.turn,
        match['_farthest'].turn,
        goalUPS,
        rendersPerSecond.tps,
        Math.abs(updatesPerSecond.tps) < Math.max(0, Math.abs(goalUPS) - 2)
      );

      // run simulation
      // this may look innocuous, but it's a large chunk of the run time
      match.compute(5 /* ms */);

      // update the info string in controls
      if (lastSelectedID !== undefined) {
        let bodies = match.current.bodies.arrays;
        let index = bodies.id.indexOf(lastSelectedID)
        if (index === -1) {
          // The body doesn't exist anymore so indexOf returns -1
          lastSelectedID = undefined;
        } else {
          let id = bodies.id[index];
          let x = bodies.x[index];
          let y = bodies.y[index];

          let on = bodies.onDirt[index];

          let type = bodies.type[index];
          let bytecodes = bodies.bytecodesUsed[index];
          if (type === cst.COW) {
            this.controls.setInfoString(id, x, y, on);
          } 
          else if (type === cst.LANDSCAPER) {
            this.controls.setInfoString(id, x, y, on, bodies.carryDirt[index], bytecodes);
          } 
          else {
            this.controls.setInfoString(id, x, y, on, undefined, bytecodes);
          }
        }
      }

      this.console.seekRound(match.current.turn);
      lastTime = curTime;
      lastTurn = match.current.turn;

      // @ts-ignore
      // renderer.render(match.current, match.current.minCorner, match.current.maxCorner);
      if (this.conf.interpolate &&
        match.current.turn + 1 < match.deltas.length &&
        goalUPS < rendersPerSecond.tps) {

          console.log('interpolating!!');

      nextStep.loadNextStep(
        match.current,
        match.deltas[match.current.turn + 1]
      );

      let lerp = Math.min(interpGameTime - match.current.turn, 1);

      // @ts-ignore
      renderer.render(match.current, match.current.minCorner, match.current.maxCorner, nextStep, lerp);
    } else {
          console.log('not interpolating!!');
      // interpGameTime might be incorrect if we haven't computed fast enough
      // @ts-ignore
      renderer.render(match.current, match.current.minCorner, match.current.maxCorner);
    }

      this.stats.showBlock(match.blockchain[match.current.turn]);
      this.updateStats(match.current, meta);
      this.loopID = window.requestAnimationFrame(loop);

    };
    this.loopID = window.requestAnimationFrame(loop);
  }
}

export enum TournamentState {
  START_SPLASH,
  MID_GAME,
  END_SPLASH
};
