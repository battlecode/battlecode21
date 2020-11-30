import Metadata from './metadata';
import GameWorld from './gameworld';
import { schema } from 'battlecode-schema';
export declare type Log = {
    team: string;
    robotType: string;
    id: number;
    round: number;
    text: string;
};
export declare type Transaction = {
    cost: number;
    message: Array<number>;
};
export declare type Block = {
    messages: Array<Transaction>;
    round: number;
};
export declare type ProfilerEvent = {
    type: string;
    at: number;
    frame: number;
};
export declare type ProfilerProfile = {
    name: string;
    events: Array<ProfilerEvent>;
};
export declare type ProfilerFile = {
    frames: Array<string>;
    profiles: Array<ProfilerProfile>;
};
/**
 * A timeline of a match. Allows you to see what the state of the match was,
 * at any particular time.
 *
 * Call timeline.seek() to request the state of the world at a particular
 * time; then call timeline.compute() to allow the timeline to perform computations.
 *
 * Note that this API is a state machine: you call methods on it,
 * then call compute() to let it do its thing, and then inspect it
 * to see what its current state is.
 *
 * This is awkward, but less so than callbacks.
 */
export default class Match {
    /**
     * How frequently to store a snapshots of the gameworld.
     */
    readonly snapshotEvery: number;
    /**
     * Snapshots of the game world.
     * [0] is round 0 (the one stored in the GameMap), [1] is round
     * snapshotEvery * 1, [2] is round snapshotEvery * 2, etc.
     *
     * By this, we can quickly navigate to arbitrary time
     * Saving game world for all round will use too much memory
     */
    readonly snapshots: Array<GameWorld>;
    /**
     * Sets of changes.
     * [1] is the change between round 0 and 1, [2] is the change between
     * round 1 and 2, etc.
     * [0] is not stored.
     */
    readonly deltas: Array<schema.Round>;
    /**
     * The logs of this match, bucketed by round.
     */
    readonly logs: Array<Array<Log>>;
    /**
     * The blockchain, an array of blocks per round.
     */
    readonly blockchain: Array<Block>;
    /**
     * The profiler files belong to this match.
     * Contains 2 items (team A and team B) if profiling was enabled, empty otherwise.
     */
    readonly profilerFiles: Array<ProfilerFile>;
    /**
     * The current game world.
     * DO NOT CACHE this reference between calls to seek() and compute(), it may
     * change.
     */
    readonly current: GameWorld;
    private _current;
    /**
     * The farthest snapshot of the game world we've evaluated.
     * It is possible that _farthest === _current.
     */
    private _farthest;
    /**
     * The round we're attempting to seek to.
     */
    readonly seekTo: number;
    private _seekTo;
    /**
     * Whether we've arrived at the seek point.
     */
    readonly arrived: boolean;
    /**
     * The last turn in the match.
     */
    readonly lastTurn: number;
    private _lastTurn;
    /**
     * The ID of the winner of this match.
     */
    readonly winner: number;
    private _winner;
    /**
     * Whether this match has fully loaded.
     */
    readonly finished: boolean;
    /**
     * The maximum turn that can happen in this match.
     */
    readonly maxTurn: number;
    /**
     * Create a Timeline.
     */
    constructor(header: schema.MatchHeader, meta: Metadata);
    /**
     * Store a schema.Round and the logs contained in it.
     */
    applyDelta(delta: schema.Round): void;
    /**
     * parses blockchain broadcasts
     */
    parseBlockchain(delta: schema.Round): void;
    /**
     * Parse logs for a round.
     */
    parseLogs(round: number, logs: string): void;
    /**
     * Finish the timeline.
     */
    applyFooter(footer: schema.MatchFooter): void;
    /**
     * Attempt to set seekTo to a particular point.
     * Return whether or not it is possible to seek to that round;
     * if we don't have deltas to it, we can't.
     * If we can, each call to compute() will update state until current.turn === seekTo
     */
    seek(round: number): void;
    /**
     * Perform computations for some amount of time.
     * We try to overshoot timeGoal as little as possible; however, if turn applications start taking a long time, we may overshoot it arbitrarily far.
     * If timeGoal is 0, we'll compute until we're done.
     */
    compute(timeGoal?: number): void;
    /**
     * Apply a delta to a GameWorld, based on world.turn.
     * That is, go from world.turn to world.turn+1. In other words, this is computing the effects of world.turn+1.
     */
    private _processDelta;
}
