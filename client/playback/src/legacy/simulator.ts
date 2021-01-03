import Metadata from '../metadata';
import GameWorld from '../gameworld';
import {schema} from 'battlecode-schema';

/**
 * A function that runs through a GameWrapper containing a single match, and
 * returns the state of the world at the end of the game.
 *
 * Intended for testing.
 */
export function crunch(game: schema.GameWrapper): GameWorld {
  const gameHeader = game.events(0).e(new schema.GameHeader()) as schema.GameHeader;
  const metadata = new Metadata().parse(gameHeader);
  const world = new GameWorld(metadata);
  const matchHeader = game.events(1).e(new schema.MatchHeader()) as schema.MatchHeader;
  world.loadFromMatchHeader(matchHeader);

  for (let i = 2;; i++) {
    const event = game.events(i);
    if (event.eType() === schema.Event.MatchFooter) {
      return world;
    }
    // must be a Round
    world.processDelta(event.e(new schema.Round()) as schema.Round);
  }
}
