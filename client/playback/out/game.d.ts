import Metadata from './metadata';
import { schema } from 'battlecode-schema';
import Match from './match';
/**
 * Represents an entire game.
 * Contains a Match for every match in a game.
 */
export default class Game {
    /**
     * Whether the game has finished loading.
     */
    readonly finished: boolean;
    /**
     * The ID the of winner of the overall game.
     */
    readonly winner: number;
    private _winner;
    /**
     * Every match that's happened so far.
     */
    private readonly _matches;
    /**
     * Match count.
     */
    readonly matchCount: number;
    /**
     * The metadata of the game.
     */
    readonly meta: Metadata;
    private _meta;
    /**
     * Create a Game with nothing inside.
     */
    constructor();
    /**
     * Get a particular match.
     */
    getMatch(index: number): Match;
    /**
     * Apply an event to the game.
     */
    applyEvent(event: schema.EventWrapper): void;
    /**
     * Apply an event from a NON-GZIPPED ArrayBuffer containing an EventWrapper.
     *
     * It is expected to be non-gzipped because it was sent over a websocket; if
     * you're reading from a file, use loadFullGameRaw.
     *
     * Do not mutate `data` after calling this function!
     */
    applyEventRaw(data: ArrayBuffer): void;
    /**
     * Load a game all at once.
     */
    loadFullGame(wrapper: schema.GameWrapper): void;
    /**
     * Load a full game from a gzipped ArrayBuffer containing a GameWrapper.
     *
     * Do not mutate `data` after calling this function!
     */
    loadFullGameRaw(data: ArrayBuffer): void;
}
