import StructOfArrays from './soa';
import Metadata from './metadata';
import { schema } from 'battlecode-schema';
import Victor = require('victor');
export declare type DiedBodiesSchema = {
    id: Int32Array;
    x: Int32Array;
    y: Int32Array;
};
export declare type BodiesSchema = {
    id: Int32Array;
    team: Int8Array;
    type: Int8Array;
    x: Int32Array;
    y: Int32Array;
    onDirt: Int32Array;
    carryDirt: Int32Array;
    cargo: Int32Array;
    isCarried: Uint8Array;
    bytecodesUsed: Int32Array;
};
export declare type MapStats = {
    name: string;
    minCorner: Victor;
    maxCorner: Victor;
    bodies: schema.SpawnedBodyTable;
    randomSeed: number;
    dirt: Int32Array;
    flooded: Int8Array;
    globalPollution: number;
    localPollutions: schema.LocalPollutionTable;
    pollution: Int32Array;
    soup: Int32Array;
    getIdx: (x: number, y: number) => number;
    getLoc: (idx: number) => Victor;
};
export declare type TeamStats = {
    soup: number;
    robots: [number, number, number, number, number, number, number, number, number, number, number];
};
export declare type IndicatorDotsSchema = {
    id: Int32Array;
    x: Int32Array;
    y: Int32Array;
    red: Int32Array;
    green: Int32Array;
    blue: Int32Array;
};
export declare type IndicatorLinesSchema = {
    id: Int32Array;
    startX: Int32Array;
    startY: Int32Array;
    endX: Int32Array;
    endY: Int32Array;
    red: Int32Array;
    green: Int32Array;
    blue: Int32Array;
};
export declare type NetGunShotSchema = {
    id: Int32Array;
    startX: Int32Array;
    startY: Int32Array;
    endX: Int32Array;
    endY: Int32Array;
};
/**
 * A frozen image of the game world.
 *
 * TODO(jhgilles): better access control on contents.
 */
export default class GameWorld {
    /**
     * Bodies that died this round.
     * {
     *   id: Int32Array,
     *   x: Int32Array,
     *   y: Int32Array,
     * }
     */
    diedBodies: StructOfArrays<DiedBodiesSchema>;
    /**
     * Everything that isn't a bullet or indicator string.
     * {
     *   id: Int32Array,
     *   team: Int8Array,
     *   type: Int8Array,
     *   x: Int32Array,
     *   y: Int32Array,
     *   bytecodesUsed: Int32Array,
     * }
     */
    bodies: StructOfArrays<BodiesSchema>;
    teamStats: Map<number, TeamStats>;
    mapStats: MapStats;
    pollutionNeedsUpdate: boolean;
    /**
     * Indicator dots.
     * {
     *   id: Int32Array,
     *   x: Float32Array,
     *   y: Float32Array,
     *   red: Int32Array,
     *   green: Int32Array,
     *   blue: Int32Array
     * }
     */
    indicatorDots: StructOfArrays<IndicatorDotsSchema>;
    /**
     * Indicator lines.
     * {
     *   id: Int32Array,
     *   startX: Float32Array,
     *   startY: Float32Array,
     *   endX: Float32Array,
     *   endY: Float32Array,
     *   red: Int32Array,
     *   green: Int32Array,
     *   blue: Int32Array
     * }
     */
    indicatorLines: StructOfArrays<IndicatorLinesSchema>;
    /**
     * Net gun shots. Just an indicator line actually.
     */
    netGunShots: StructOfArrays<NetGunShotSchema>;
    /**
     * The current turn.
     */
    turn: number;
    /**
     * The minimum corner of the game world.
     */
    minCorner: Victor;
    /**
     * The maximum corner of the game world.
     */
    maxCorner: Victor;
    /**
     * The name of the map.
     */
    mapName: string;
    /**
     * Metadata about the current game.
     */
    meta: Metadata;
    private _bodiesSlot;
    private _localPollutionsSlot;
    private _vecTableSlot1;
    private _vecTableSlot2;
    private _rgbTableSlot;
    constructor(meta: Metadata);
    loadFromMatchHeader(header: schema.MatchHeader): void;
    /**
     * Create a copy of the world in its current state.
     */
    copy(): GameWorld;
    copyFrom(source: GameWorld): void;
    /**
     * Process a set of changes.
     */
    processDelta(delta: schema.Round): void;
    private distanceSquared;
    calculatePollutionIfNeeded(): void;
    private insertDiedBodies;
    private insertIndicatorDots;
    private insertIndicatorLines;
    private isBuilding;
    private insertBodies;
}
