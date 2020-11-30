import GameWorld from './gameworld';
import { schema } from 'battlecode-schema';
/**
 * A function that runs through a GameWrapper containing a single match, and
 * returns the state of the world at the end of the game.
 *
 * Intended for testing.
 */
export declare function crunch(game: schema.GameWrapper): GameWorld;
