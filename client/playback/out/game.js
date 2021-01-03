"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const metadata_1 = require("./metadata");
const battlecode_schema_1 = require("battlecode-schema");
const match_1 = require("./match");
const pako_1 = require("pako");
/**
 * Represents an entire game.
 * Contains a Match for every match in a game.
 */
class Game {
    /**
     * Create a Game with nothing inside.
     */
    constructor() {
        this._winner = null;
        this._matches = new Array();
        this._meta = null;
    }
    /**
     * Whether the game has finished loading.
     */
    get finished() { return this._winner !== null; }
    /**
     * The ID the of winner of the overall game.
     */
    get winner() { return this._winner; }
    /**
     * Match count.
     */
    get matchCount() { return this._matches.length; }
    /**
     * The metadata of the game.
     */
    get meta() { return this._meta; }
    /**
     * Get a particular match.
     */
    getMatch(index) {
        return this._matches[index];
    }
    /**
     * Apply an event to the game.
     */
    applyEvent(event) {
        const gameStarted = this._meta !== null;
        const matchCount = this._matches.length;
        const lastMatchFinished = matchCount > 0 ? this._matches[this._matches.length - 1].finished : true;
        console.log("event!: " + (event.eType()));
        switch (event.eType()) {
            case battlecode_schema_1.schema.Event.GameHeader:
                const gameHeader = event.e(new battlecode_schema_1.schema.GameHeader());
                if (!gameStarted) {
                    this._meta = new metadata_1.default().parse(gameHeader);
                }
                else {
                    throw new Error("Can't start already-started game");
                }
                break;
            case battlecode_schema_1.schema.Event.MatchHeader:
                const matchHeader = event.e(new battlecode_schema_1.schema.MatchHeader());
                if (gameStarted && (matchCount === 0 || lastMatchFinished)) {
                    this._matches.push(new match_1.default(matchHeader, this._meta));
                }
                else {
                    throw new Error("Can't create new game when last hasn't finished");
                }
                break;
            case battlecode_schema_1.schema.Event.Round:
                const delta = event.e(new battlecode_schema_1.schema.Round());
                if (gameStarted && matchCount > 0 && !lastMatchFinished) {
                    this._matches[this._matches.length - 1].applyDelta(delta);
                }
                else {
                    throw new Error("Can't apply delta without unfinished match");
                }
                break;
            case battlecode_schema_1.schema.Event.MatchFooter:
                const matchFooter = event.e(new battlecode_schema_1.schema.MatchFooter());
                if (gameStarted && matchCount > 0 && !lastMatchFinished) {
                    this._matches[this._matches.length - 1].applyFooter(matchFooter);
                }
                else {
                    throw new Error("Can't apply footer without unfinished match");
                }
                break;
            case battlecode_schema_1.schema.Event.GameFooter:
                const gameFooter = event.e(new battlecode_schema_1.schema.GameFooter());
                if (gameStarted && matchCount > 0 && lastMatchFinished) {
                    this._winner = gameFooter.winner();
                }
                else {
                    throw new Error("Can't finish game without finished match");
                }
                break;
            case battlecode_schema_1.schema.Event.NONE:
            default:
                throw new Error('No event to apply?');
        }
    }
    /**
     * Apply an event from a NON-GZIPPED ArrayBuffer containing an EventWrapper.
     *
     * It is expected to be non-gzipped because it was sent over a websocket; if
     * you're reading from a file, use loadFullGameRaw.
     *
     * Do not mutate `data` after calling this function!
     */
    applyEventRaw(data) {
        const event = battlecode_schema_1.schema.EventWrapper.getRootAsEventWrapper(new battlecode_schema_1.flatbuffers.ByteBuffer(new Uint8Array(data)));
    }
    /**
     * Load a game all at once.
     */
    loadFullGame(wrapper) {
        const eventSlot = new battlecode_schema_1.schema.EventWrapper();
        const eventCount = wrapper.eventsLength();
        if (eventCount < 5) {
            throw new Error(`Too few events for well-formed game: ${eventCount}`);
        }
        for (let i = 0; i < eventCount; i++) {
            this.applyEvent(wrapper.events(i, eventSlot));
        }
        if (!this.finished) {
            throw new Error("Gamewrapper did not finish game!");
        }
    }
    /**
     * Load a full game from a gzipped ArrayBuffer containing a GameWrapper.
     *
     * Do not mutate `data` after calling this function!
     */
    loadFullGameRaw(data) {
        const ungzipped = pako_1.ungzip(new Uint8Array(data));
        const wrapper = battlecode_schema_1.schema.GameWrapper.getRootAsGameWrapper(new battlecode_schema_1.flatbuffers.ByteBuffer(ungzipped));
        this.loadFullGame(wrapper);
    }
}
exports.default = Game;
