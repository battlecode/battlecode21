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
   * Turns per second.
   *
   * (DISTINCT from fps!)
   */
  readonly defaultTPS: number;

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
   * Whether or not to draw a circle under each robot
   */
  circleBots: boolean; //TODO: is this needed?

  /**
   * Whether or not to display indicator dots and lines
   */
  indicators: boolean;

  /**
   * Whether or not to display the vision range.
   */
  seeVisionRange: boolean;

    /**
   * Whether or not to display the action range.
   */
  seeActionRange: boolean;

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
  supplied = supplied || {};
  return {
    gameVersion: supplied.gameVersion || "2020.2.0.3", //TODO: Change this on each release!
    fullscreen: supplied.fullscreen || false,
    width: supplied.width || 600,
    height: supplied.height || 600,
    defaultTPS: supplied.defaultTPS || 20,
    websocketURL: supplied.websocketURL || null,
    matchFileURL: supplied.matchFileURL || null,
    pollEvery: supplied.pollEvery || 500,
    tournamentMode: supplied.tournamentMode || false,
    interpolate: supplied.interpolate || true,
    circleBots: supplied.circleBots || false,
    indicators: supplied.indicators || false,
    mode: supplied.mode || Mode.QUEUE,
    splash: supplied.splash || supplied.matchFileURL == null || true,
    seeVisionRange: supplied.seeVisionRange || false,
    seeActionRange: supplied.seeActionRange || false,
    showGrid: supplied.showGrid || false,
    viewSwamp: supplied.viewSwamp || true,
    shorterLogHeader: supplied.shorterLogHeader || false,
  };
}
