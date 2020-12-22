import StructOfArrays from './soa';
import Metadata from './metadata';
import { schema } from 'battlecode-schema';
import Victor = require('victor');
export declare type DeadBodiesSchema = {
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
    bytecodesUsed: Int32Array;
};
export declare type MapStats = {
    name: string;
    minCorner: Victor;
    maxCorner: Victor;
    bodies: schema.SpawnedBodyTable;
    randomSeed: number;
    passability: Float64Array;
    getIdx: (x: number, y: number) => number;
    getLoc: (idx: number) => Victor;
};
export declare type TeamStats = {
    robots: [number, number, number, number, number];
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
/**
 * A frozen image of the game world.
 *
 * TODO(jhgilles): better access control on contents.
 */
export default class GameWorld {
    /**
     * Bodies that died this round.
     */
    diedBodies: StructOfArrays<DeadBodiesSchema>;
    /**
     * Everything that isn't an indicator string.
     */
    bodies: StructOfArrays<BodiesSchema>;
    teamStats: Map<number, TeamStats>;
    mapStats: MapStats;
    /**
     * Indicator dots.
     */
    indicatorDots: StructOfArrays<IndicatorDotsSchema>;
    /**
     * Indicator lines.
     */
    indicatorLines: StructOfArrays<IndicatorLinesSchema>;
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
    private insertDiedBodies;
    private insertIndicatorDots;
    private insertIndicatorLines;
    private insertBodies;
}
