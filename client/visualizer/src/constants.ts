import {schema} from 'battlecode-playback';
import {Symmetry} from './mapeditor/index';
import { net } from 'electron';

// Body types
export const MINER = schema.BodyType.MINER;
export const LANDSCAPER = schema.BodyType.LANDSCAPER;
export const DRONE = schema.BodyType.DELIVERY_DRONE;
export const NET_GUN = schema.BodyType.NET_GUN;
export const COW = schema.BodyType.COW;
export const REFINERY = schema.BodyType.REFINERY;
export const VAPORATOR = schema.BodyType.VAPORATOR;
export const HQ = schema.BodyType.HQ;
export const DESIGN_SCHOOL = schema.BodyType.DESIGN_SCHOOL;
export const FULFILLMENT_CENTER = schema.BodyType.FULFILLMENT_CENTER;


// map colors
// maps elevation to rgb values
export const DIRT_COLORS: Map<number, Array<number>> = new Map<number, Array<number>>([
    [-5, [0, 147, 83]], // turquoise
    [3, [29, 201, 2]], // green
    [10, [254,205,54]], // yellow
    [90, [222, 145, 1]], // brown
    [500, [255, 0, 0]], // red
    [2000, [242, 0, 252]] // pink
]);
export const WATER_COLOR = [10,100,240];



// TODO: Old constants
// Game canvas rendering sizes
export const INDICATOR_DOT_SIZE = .3;
export const INDICATOR_LINE_WIDTH = .3;
export const SIGHT_RADIUS_LINE_WIDTH = .15

// Game canvas rendering parameters
export const HIGH_SPEED_THRESH = (4*4) - .00001;
export const MED_SPEED_THRESH = (2*2) - .00001;

// Map editor canvas parameters
export const DELTA = .0001;
export const MIN_DIMENSION = 30;
export const MAX_DIMENSION = 100;

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
  ["Maze", MapType.INTL_QUALIFYING],
  ["Squares", MapType.INTL_QUALIFYING],
  ["RealArt", MapType.INTL_QUALIFYING],
  ["DoesNotExist", MapType.INTL_QUALIFYING],
  ["IceCream", MapType.INTL_QUALIFYING],
  ["Constriction", MapType.INTL_QUALIFYING],
  ["Islands2", MapType.INTL_QUALIFYING],
  ["Prison", MapType.INTL_QUALIFYING],
  ["DisproportionatelySmallGap", MapType.INTL_QUALIFYING],
  ["Climb", MapType.INTL_QUALIFYING],
  ["TwoLakeLand", MapType.INTL_QUALIFYING],
  ["Europe", MapType.INTL_QUALIFYING],
  ["AMaze", MapType.SEEDING],
  ["BeachFrontProperty", MapType.SEEDING],
  ["Egg", MapType.SEEDING],
  ["Hourglass", MapType.SEEDING],
  ["MtDoom", MapType.SEEDING],
  ["Sheet4", MapType.SEEDING],
  ["Showerhead", MapType.SEEDING],
  ["Spiral", MapType.SEEDING],
  ["Swirl", MapType.SEEDING],
  ["TheHighGround", MapType.SEEDING],
  ["Toothpaste", MapType.SEEDING],
  ["WhyDidntTheyUseEagles", MapType.SEEDING],
  ["NoU", MapType.SEEDING],
  ["MoreCowbell", MapType.SEEDING],
  ["FourLakeLand", MapType.DEFAULT],
  ["CentralLake", MapType.DEFAULT],
  ["ALandDivided", MapType.DEFAULT],
  ["SoupOnTheSide", MapType.DEFAULT],
  ["TwoForOneAndTwoForAll", MapType.DEFAULT],
  ["WaterBot", MapType.DEFAULT],
  ["CentralSoup", MapType.DEFAULT],
  ["ChristmasInJuly", MapType.SPRINT],
  ["CosmicBackgroundRadiation", MapType.SPRINT],
  ["ClearlyTwelveHorsesInASalad", MapType.SPRINT],
  ["CowFarm", MapType.SPRINT],
  ["DidAMonkeyMakeThis", MapType.SPRINT],
  ["GSF", MapType.SPRINT],
  ["Hills", MapType.SPRINT],
  ["InADitch", MapType.SPRINT],
  ["Infinity", MapType.SPRINT],
  ["Islands", MapType.SPRINT],
  ["IsThisProcedural", MapType.SPRINT],
  ["OmgThisIsProcedural", MapType.SPRINT],
  ["ProceduralConfirmed", MapType.SPRINT],
  ["RandomSoup1", MapType.SPRINT],
  ["RandomSoup2", MapType.SPRINT],
  ["Soup", MapType.SPRINT],
  ["Volcano", MapType.SPRINT],
  ["WateredDown", MapType.SPRINT]
]);

export function bodyTypeToString(bodyType: schema.BodyType) {
  switch(bodyType) {
    case MINER:             return "miner";
    case LANDSCAPER:        return "landscaper";
    case DRONE:             return "drone";
    case NET_GUN:           return "netGun";
    case COW:               return "cow";
    case REFINERY:          return "refinery";
    case VAPORATOR:         return "vaporator";
    case HQ:                return "HQ";
    case DESIGN_SCHOOL:     return "designSchool";
    case FULFILLMENT_CENTER:return "fulfillmentCenter";
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

// TODO: fix radius (is this vision that can be toggled in sidebar?)
export function radiusFromBodyType(bodyType: schema.BodyType) {
  switch(bodyType) {
    case MINER:
    case LANDSCAPER:
    case DRONE:
    case NET_GUN:
    case COW:
    case REFINERY:
    case VAPORATOR:
    case HQ:
    case DESIGN_SCHOOL:
    case FULFILLMENT_CENTER: return 1;
    default: throw new Error("invalid body type");
  }
}

export function waterLevel(x: number) {
  return (Math.exp(0.0028*x-1.38*Math.sin(0.00157*x-1.73)+1.38*Math.sin(-1.73))-1)
}
