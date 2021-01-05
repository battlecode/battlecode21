import {schema} from 'battlecode-playback';
import {Symmetry} from './mapeditor/index';

// Body types
export const ENLIGHTENMENT_CENTER = schema.BodyType.ENLIGHTENMENT_CENTER;
export const POLITICIAN = schema.BodyType.POLITICIAN;
export const SLANDERER = schema.BodyType.SLANDERER;
export const MUCKRAKER = schema.BodyType.MUCKRAKER;

export const bodyTypeList: number[] = [ENLIGHTENMENT_CENTER, POLITICIAN, SLANDERER, MUCKRAKER];
export const initialBodyTypeList: number[] = [ENLIGHTENMENT_CENTER];

export const bodyTypePriority: number[] = []; // for guns, drones, etc. that should be drawn over other robots

export const TILE_COLORS: Array<number>[] = [ // RGB
  [234, 255, 241],
  [247, 236, 142],
  [251, 253, 63],
  [225, 172, 107],
  [239, 88, 193],
  [254, 15, 252]
];
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
  const floatLevel = ((1-x) - 0.1) / 0.9 * nLev;
  const level = Math.floor(floatLevel)
  return Math.min(nLev - 1, Math.max(0, level));
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
  SPRINT,
  SEEDING,
  INTL_QUALIFYING,
  US_QUALIFYING,
  HS,
  NEWBIE,
  FINAL,
  CUSTOM
};
export const SERVER_MAPS: Map<string, MapType> = new Map<string, MapType>([
     ["maptestsmall", MapType.DEFAULT]
  // ["Maze", MapType.INTL_QUALIFYING],
  // ["Squares", MapType.INTL_QUALIFYING],
  // ["RealArt", MapType.INTL_QUALIFYING],
  // ["DoesNotExist", MapType.INTL_QUALIFYING],
  // ["IceCream", MapType.INTL_QUALIFYING],
  // ["Constriction", MapType.INTL_QUALIFYING],
  // ["Islands2", MapType.INTL_QUALIFYING],
  // ["Prison", MapType.INTL_QUALIFYING],
  // ["DisproportionatelySmallGap", MapType.INTL_QUALIFYING],
  // ["Climb", MapType.INTL_QUALIFYING],
  // ["TwoLakeLand", MapType.INTL_QUALIFYING],
  // ["Europe", MapType.INTL_QUALIFYING],
  // ["AMaze", MapType.SEEDING],
  // ["BeachFrontProperty", MapType.SEEDING],
  // ["Egg", MapType.SEEDING],
  // ["Hourglass", MapType.SEEDING],
  // ["MtDoom", MapType.SEEDING],
  // ["Sheet4", MapType.SEEDING],
  // ["Showerhead", MapType.SEEDING],
  // ["Spiral", MapType.SEEDING],
  // ["Swirl", MapType.SEEDING],
  // ["TheHighGround", MapType.SEEDING],
  // ["Toothpaste", MapType.SEEDING],
  // ["WhyDidntTheyUseEagles", MapType.SEEDING],
  // ["NoU", MapType.SEEDING],
  // ["MoreCowbell", MapType.SEEDING],
  // ["FourLakeLand", MapType.DEFAULT],
  // ["CentralLake", MapType.DEFAULT],
  // ["ALandDivided", MapType.DEFAULT],
  // ["SoupOnTheSide", MapType.DEFAULT],
  // ["TwoForOneAndTwoForAll", MapType.DEFAULT],
  // ["WaterBot", MapType.DEFAULT],
  // ["CentralSoup", MapType.DEFAULT],
  // ["ChristmasInJuly", MapType.SPRINT],
  // ["CosmicBackgroundRadiation", MapType.SPRINT],
  // ["ClearlyTwelveHorsesInASalad", MapType.SPRINT],
  // ["CowFarm", MapType.SPRINT],
  // ["DidAMonkeyMakeThis", MapType.SPRINT],
  // ["GSF", MapType.SPRINT],
  // ["Hills", MapType.SPRINT],
  // ["InADitch", MapType.SPRINT],
  // ["Infinity", MapType.SPRINT],
  // ["Islands", MapType.SPRINT],
  // ["IsThisProcedural", MapType.SPRINT],
  // ["OmgThisIsProcedural", MapType.SPRINT],
  // ["ProceduralConfirmed", MapType.SPRINT],
  // ["RandomSoup1", MapType.SPRINT],
  // ["RandomSoup2", MapType.SPRINT],
  // ["Soup", MapType.SPRINT],
  // ["Volcano", MapType.SPRINT],
  // ["WateredDown", MapType.SPRINT]
]);

export function bodyTypeToString(bodyType: schema.BodyType) {
  switch(bodyType) {
    case ENLIGHTENMENT_CENTER:
      return "enlightenmentCenter";
    case POLITICIAN:
      return "politician";
    case SLANDERER:
      return "slanderer";
    case MUCKRAKER:
      return "muckraker";
    default:                throw new Error("invalid body type");
  }
}

export function symmetryToString(symmetry: Symmetry) {
  switch(symmetry) {
    case Symmetry.ROTATIONAL: return "Rotational";
    case Symmetry.HORIZONTAL: return "Horizontal";
    case Symmetry.VERTICAL:   return "Vertical";
    default:         throw new Error("invalid symmetry");
  }
}

export function abilityToEffectString(effect: number): string | null {
  switch(effect) {
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
