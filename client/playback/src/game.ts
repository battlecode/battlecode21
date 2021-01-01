import Metadata from './metadata';
import GameWorld from './gameworld';
import { flatbuffers, schema } from 'battlecode-schema';
import Match from './match';
import {ungzip} from 'pako';

/**
 * Represents an entire game.
 * Contains a Match for every match in a game.
 */
export default class Game {
  /**
   * Whether the game has finished loading.
   */
  get finished() { return this._winner !== null; }

  /**
   * The ID the of winner of the overall game.
   */
  get winner() { return this._winner; }
  private _winner: number | null;

  /**
   * Every match that's happened so far.
   */
  private readonly _matches: Array<Match>;

  /**
   * Match count.
   */
  get matchCount() { return this._matches.length; }

  /**
   * The metadata of the game.
   */
  get meta() { return this._meta; }
  private _meta: Metadata | null;

  /**
   * Create a Game with nothing inside.
   */
  constructor() {
    this._winner = null;
    this._matches = new Array();
    this._meta = null;
  }

  /**
   * Get a particular match.
   */
  getMatch(index: number): Match {
    return this._matches[index];
  }

  /**
   * Apply an event to the game.
   */
  applyEvent(event: schema.EventWrapper) {
    const gameStarted = this._meta !== null;
    const matchCount = this._matches.length;
    const lastMatchFinished = matchCount > 0? this._matches[this._matches.length - 1].finished : true;
    console.log("event!: " + (event.eType()));

    switch (event.eType()) {
      case schema.Event.GameHeader:
        const gameHeader = event.e(new schema.GameHeader()) as schema.GameHeader;
        if (!gameStarted) {
          this._meta = new Metadata().parse(gameHeader);
        } else {
          throw new Error("Can't start already-started game");
        }
        break;

      case schema.Event.MatchHeader:
        const matchHeader = event.e(new schema.MatchHeader()) as schema.MatchHeader;
        if (gameStarted && (matchCount === 0 || lastMatchFinished)) {
          this._matches.push(new Match(matchHeader, this._meta as Metadata));
        } else {
          throw new Error("Can't create new game when last hasn't finished");
        }
        break;

      case schema.Event.Round:
        const delta = event.e(new schema.Round()) as schema.Round;
        if (gameStarted && matchCount > 0 && !lastMatchFinished) {
          this._matches[this._matches.length - 1].applyDelta(delta);
        } else {
          throw new Error("Can't apply delta without unfinished match");
        }
        break;

      case schema.Event.MatchFooter:
        const matchFooter = event.e(new schema.MatchFooter()) as schema.MatchFooter;
        if (gameStarted && matchCount > 0 && !lastMatchFinished) {
          this._matches[this._matches.length - 1].applyFooter(matchFooter);
        } else {
          throw new Error("Can't apply footer without unfinished match");
        }
        break;

      case schema.Event.GameFooter:
        const gameFooter = event.e(new schema.GameFooter()) as schema.GameFooter;
        if (gameStarted && matchCount > 0 && lastMatchFinished) {
          this._winner = gameFooter.winner();
        } else {
          throw new Error("Can't finish game without finished match");
        }
        break;

      case schema.Event.NONE:
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
  applyEventRaw(data: ArrayBuffer) {
    const event = schema.EventWrapper.getRootAsEventWrapper(
      new flatbuffers.ByteBuffer(new Uint8Array(data))
    );
  }

  /**
   * Load a game all at once.
   */
  loadFullGame(wrapper: schema.GameWrapper) {
    const eventSlot = new schema.EventWrapper();
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
  loadFullGameRaw(data: ArrayBuffer) {
    const ungzipped = ungzip(new Uint8Array(data));
    const wrapper = schema.GameWrapper.getRootAsGameWrapper(
      new flatbuffers.ByteBuffer(ungzipped)
    );
    this.loadFullGame(wrapper);
  }
}
