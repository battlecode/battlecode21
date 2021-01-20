/**
 * All of the top-level tunable options for the game client.
 */
export interface Config {
  /**
   * The version of the game we're simulating.
   */
  readonly gameVersion: string;

  /**
   * Whether to try to run the game in full-screen
   */
  readonly fullscreen: boolean;

  /**
   * Dimensions of the canvas
   */
  readonly width: number;
  readonly height: number;

  /**
   * Controls resolution of the canvas.
   */
  readonly upscale: number;

  /**
   * Turns per second.
   *
   * (DISTINCT from fps!)
   */
  readonly defaultTPS: number; // TODO: use this.

  /**
   * The url to listen for websocket data on, if any.
   */
  readonly websocketURL: string | null;

  /**
   * The match file URL to load when we start.
   */
  readonly matchFileURL: string | null;

  /**
   * How often to poll the server via websocket, in ms.
   */
  readonly pollEvery: number;

  /**
   * Whether tournament mode is enabled.
   */
  readonly tournamentMode: boolean;

  /**
   * Whether or not to interpolate between frames.
   */
  interpolate: boolean;

  /**
   * Whether or not to display indicator dots and lines for clicked robot.
   */
  indicators: boolean;

  /**
   * Whether or not to display all indicator lines.
   */
  allIndicators: boolean;

  /**
   * Whether or not to display the action radius.
   */
  seeActionRadius: boolean;

  /**
   * Whether or not to display the sensor radius.
   */
  seeSensorRadius: boolean;

  /**
   * Whether or not to display the detection radius.
   */
  seeDetectionRadius: boolean;

  /**
   * The mode of the game
   */
  mode: Mode;

  /**
   * Whether to display the splash screen.
   */
  splash: boolean;

  /**
   * Whether to display the grid
   */
  showGrid: boolean;

  /**
   * Viewoption for Swamp
   */
  viewSwamp: boolean;

  /**
   * Whether logs should show shorter header
   */
  shorterLogHeader: boolean;

  /**
   * Whether we should process a match's logs.
   */
  processLogs: boolean;

  /**
   * Whether to load the profiler.
   */
  useProfiler: boolean;

  /**
   * Whether to do profiling on profiled match files, assuming the profiler is loaded.
   */
  doProfiling: boolean;

  /**
   * Whether to rotate tall maps.
   */
  doRotate: boolean;

  /**
   * Whether the map is currently rotated. TODO: don't make this a global variable.
   */
  doingRotate: boolean;
}

/**
 * Different game modes that determine what is displayed on the client
 */
export enum Mode {
  GAME,
  HELP,
  LOGS,
  RUNNER,
  QUEUE,
  MAPEDITOR,
  PROFILER
}

/**
 * Handle setting up any values that the user doesn't set.
 */
export function defaults(supplied?: any): Config {
  let conf: Config = {
    gameVersion: "2021.2.4.2", //TODO: Change this on each release!
    fullscreen: false,
    width: 600,
    height: 600,
    upscale: 1800,
    defaultTPS: 20,
    websocketURL: null,
    matchFileURL: null,
    pollEvery: 500,
    tournamentMode: false,
    interpolate: true,
    indicators: false,
    allIndicators: false,
    mode: Mode.QUEUE,
    splash: true,
    seeActionRadius: false,
    seeSensorRadius: false,
    seeDetectionRadius: false,
    showGrid: false,
    viewSwamp: true,
    shorterLogHeader: false,
    processLogs: true,
    useProfiler: true,
    doProfiling: true,
    doRotate: false,
    doingRotate: false
  };
  return Object.assign(conf, supplied);
}
