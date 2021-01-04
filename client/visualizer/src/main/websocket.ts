import {Game, schema, flatbuffers} from 'battlecode-playback';
import {Config} from '../config';

/**
 * Listens for incoming data on a websocket.
 */
export default class WebSocketListener {
  url: string;
  pollEvery: number;
  currentGame: Game | null;
  onGameReceived: (game: Game) => void;

  /**
   * Only called when the very first match is loaded; autostarts.
   */
  firstMatch: boolean;
  onFirstMatch: () => void;
  onOtherMatch: () => void;

  constructor(url: string, pollEvery: number) {
    this.url = url;
    this.pollEvery = pollEvery;
    this.firstMatch = true;
  }

  start(onGameReceived: (game: Game) => void, onFirstMatch: () => void, onOtherMatch: () => void) {
    this.onGameReceived = onGameReceived;
    this.onFirstMatch = onFirstMatch;
    this.onOtherMatch = onOtherMatch;
    this.poll();
  }

  private poll() {
    const ws = new WebSocket(this.url);
    ws.binaryType = "arraybuffer";
    ws.onopen = (event) => {
      console.log(`Connected to ${this.url}`);
    };
    ws.onmessage = (event) => {
      this.handleEvent(<ArrayBuffer> event.data);
    };
    ws.onerror = (event) => {
    };
    ws.onclose = (event) => {
      window.setTimeout(() => {
        this.poll()
      }, this.pollEvery);
    };
  }

  /**
   * Handle a new event.
   */
  private handleEvent(data: ArrayBuffer) {
    const event = schema.EventWrapper.getRootAsEventWrapper(
      new flatbuffers.ByteBuffer(new Uint8Array(data))
    );

    if (event.eType() === schema.Event.GameHeader) {
      if (this.currentGame !== null) {
        console.error("Skipping end of game from websocket.");
      }

      this.currentGame = new Game();
      this.onGameReceived(this.currentGame);
      this.firstMatch = true;
      this.currentGame.applyEvent(event);
    } else {
      if (this.currentGame === null) {
        console.error("Can't apply event to non-started game, skipping.");
        return;
      }

      this.currentGame.applyEvent(event);


      if (event.eType() === schema.Event.MatchHeader || event.eType() === schema.Event.MatchFooter) {
        
        if(this.firstMatch && event.eType() === schema.Event.MatchHeader) {
          this.firstMatch = false;
          this.onFirstMatch();
        } else {
          this.onOtherMatch();
        }
        
      } else if (event.eType() === schema.Event.GameFooter) {
        this.currentGame = null;
      }
    }
  }
}
