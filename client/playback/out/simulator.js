"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const metadata_1 = require("./metadata");
const gameworld_1 = require("./gameworld");
const battlecode_schema_1 = require("battlecode-schema");
/**
 * A function that runs through a GameWrapper containing a single match, and
 * returns the state of the world at the end of the game.
 *
 * Intended for testing.
 */
function crunch(game) {
    const gameHeader = game.events(0).e(new battlecode_schema_1.schema.GameHeader());
    const metadata = new metadata_1.default().parse(gameHeader);
    const world = new gameworld_1.default(metadata);
    const matchHeader = game.events(1).e(new battlecode_schema_1.schema.MatchHeader());
    world.loadFromMatchHeader(matchHeader);
    for (let i = 2;; i++) {
        const event = game.events(i);
        if (event.eType() === battlecode_schema_1.schema.Event.MatchFooter) {
            return world;
        }
        // must be a Round
        world.processDelta(event.e(new battlecode_schema_1.schema.Round()));
    }
}
exports.crunch = crunch;
