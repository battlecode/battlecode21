import { schema } from 'battlecode-playback';
import { Symmetry } from './mapeditor/index';

// Body types
export const ENLIGHTENMENT_CENTER = schema.BodyType.ENLIGHTENMENT_CENTER;
export const POLITICIAN = schema.BodyType.POLITICIAN;
export const SLANDERER = schema.BodyType.SLANDERER;
export const MUCKRAKER = schema.BodyType.MUCKRAKER;

export const bodyTypeList: number[] = [ENLIGHTENMENT_CENTER, POLITICIAN, SLANDERER, MUCKRAKER];
export const initialBodyTypeList: number[] = [ENLIGHTENMENT_CENTER];

export const bodyTypePriority: number[] = []; // for guns, drones, etc. that should be drawn over other robots

export const TILE_COLORS: Array<number>[] = [[119, 228, 88], [144, 230, 83], [166, 231, 79], [187, 232, 76], [206, 233, 76], [231, 207, 66], [245, 182, 72], [249, 158, 86], [219, 115, 109], [163, 90, 118], [99, 73, 103], [51, 52, 65]];
// flashy colors
// [0, 147, 83], // turquoise
// [29, 201, 2], // green
// [254, 205, 54], // yellow
// [222, 145, 1], // brown
// [255, 0, 0], // red
// [242, 0, 252] // pink

// Given passability, get index of tile to use.
export const getLevel = (x: number): number => {
  const nLev = TILE_COLORS.length;
  const floatLevel = ((1 - x) - 0.1) / 0.9 * nLev;
  const level = Math.floor(floatLevel)
  return Math.min(nLev - 1, Math.max(0, level));
}

export const passiveInfluenceRate = (round: number): number => {
  //return Math.floor((1/50 + 0.03 * Math.exp(-0.001 * x)) * x); this one's for slanderers
  return Math.ceil(0.2 * Math.sqrt(round));
}

export const buffFactor = (numBuffs: number): number => {
  return 1 + 0.001 * numBuffs;
}

export const ACTION_RADIUS_COLOR = "#46ff00";
export const SENSOR_RADIUS_COLOR = "#0000ff";

// Expected bot image size
export const IMAGE_SIZE = 128;

// Game canvas rendering sizes
export const INDICATOR_DOT_SIZE = .3;
export const INDICATOR_LINE_WIDTH = .3;
export const SIGHT_RADIUS_LINE_WIDTH = .15

// Game canvas rendering parameters
export const EFFECT_STEP = 200; //time change between effect animations

// Map editor canvas parameters
export const DELTA = .0001;
export const MIN_DIMENSION = 15;
export const MAX_DIMENSION = 100;

// Initial influence of enlightenment center, for map editor
export const INITIAL_INFLUENCE = 150;

// Server settings
export const NUMBER_OF_TEAMS = 2;
// export const VICTORY_POINT_THRESH = 1000;

// Other constants
// export const BULLET_THRESH = 10000;

// Maps available in the server.
// The key is the map name and the value is the type
export enum MapType {
  DEFAULT,
  SPRINT_1,
  SPRINT_2,
  INTL_QUALIFYING,
  US_QUALIFYING,
  HS,
  NEWBIE,
  FINAL,
  CUSTOM
};
export const SERVER_MAPS: Map<string, MapType> = new Map<string, MapType>([
  ["maptestsmall", MapType.DEFAULT],
  ["circle", MapType.DEFAULT],
  ["quadrants", MapType.DEFAULT],
  ["Andromeda", MapType.SPRINT_1],
  ["Arena", MapType.SPRINT_1],
  ["Bog", MapType.SPRINT_1],
  ["Branches", MapType.SPRINT_1],
  ["Chevron", MapType.SPRINT_1],
  ["Corridor", MapType.SPRINT_1],
  ["Cow", MapType.SPRINT_1],
  ["CrossStitch", MapType.SPRINT_1],
  ["CrownJewels", MapType.SPRINT_1],
  ["ExesAndOhs", MapType.SPRINT_1],
  ["FiveOfHearts", MapType.SPRINT_1],
  ["Gridlock", MapType.SPRINT_1],
  ["Illusion", MapType.SPRINT_1],
  ["NotAPuzzle", MapType.SPRINT_1],
  ["Rainbow", MapType.SPRINT_1],
  ["SlowMusic", MapType.SPRINT_1],
  ["Snowflake", MapType.SPRINT_1],
  ["BadSnowflake", MapType.SPRINT_2],
  ["CringyAsF", MapType.SPRINT_2],
  ["FindYourWay", MapType.SPRINT_2],
  ["GetShrekt", MapType.SPRINT_2],
  ["Goldfish", MapType.SPRINT_2],
  ["HexesAndOhms", MapType.SPRINT_2],
  ["Licc", MapType.SPRINT_2],
  ["MainCampus", MapType.SPRINT_2],
  ["Punctuation", MapType.SPRINT_2],
  ["Radial", MapType.SPRINT_2],
  ["SeaFloor", MapType.SPRINT_2],
  ["Sediment", MapType.SPRINT_2],
  ["Smile", MapType.SPRINT_2],
  ["SpaceInvaders", MapType.SPRINT_2],
  ["Surprised", MapType.SPRINT_2],
  ["VideoGames", MapType.SPRINT_2]
]);

export function bodyTypeToString(bodyType: schema.BodyType) {
  switch (bodyType) {
    case ENLIGHTENMENT_CENTER:
      return "enlightenmentCenter";
    case POLITICIAN:
      return "politician";
    case SLANDERER:
      return "slanderer";
    case MUCKRAKER:
      return "muckraker";
    default: throw new Error("invalid body type");
  }
}

export function symmetryToString(symmetry: Symmetry) {
  switch (symmetry) {
    case Symmetry.ROTATIONAL: return "Rotational";
    case Symmetry.HORIZONTAL: return "Horizontal";
    case Symmetry.VERTICAL: return "Vertical";
    default: throw new Error("invalid symmetry");
  }
}

export function abilityToEffectString(effect: number): string | null {
  switch (effect) {
    case 1:
      return "empower";
    case 2:
      return "expose";
    case 3:
      return "embezzle";
    case 4:
      return "camouflage_red";
    case 5:
      return "camouflage_blue";
    default:
      return null;
  }
}

// TODO: fix radius (is this vision that can be toggled in sidebar?)
export function radiusFromBodyType(bodyType: schema.BodyType) {
  return -1;
  // switch(bodyType) {
  //   case MINER:
  //   case LANDSCAPER:
  //   case DRONE:
  //   case NET_GUN:
  //   case COW:
  //   case REFINERY:
  //   case VAPORATOR:
  //   case HQ:
  //   case DESIGN_SCHOOL:
  //   case FULFILLMENT_CENTER: return 1;
  //   default: throw new Error("invalid body type");
  // }
}

// export function waterLevel(x: number) {
//   return (Math.exp(0.0028*x-1.38*Math.sin(0.00157*x-1.73)+1.38*Math.sin(-1.73))-1)
// }
