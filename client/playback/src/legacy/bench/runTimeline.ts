import {readFileSync} from 'fs';
import {crunch} from '../simulator';
import {schema, flatbuffers} from 'battlecode-schema';
import Game from '../../game';

const wrapper = schema.GameWrapper.getRootAsGameWrapper(
  new flatbuffers.ByteBuffer(new Uint8Array(readFileSync('test.bc20')))
);

const game = new Game();
game.loadFullGame(wrapper);

for (let i = 0; i < game.matchCount; i++) {
  console.log(`running game ${i}`);
  game.getMatch(i).compute(0);
}
