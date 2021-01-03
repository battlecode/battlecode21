import {schema, flatbuffers} from 'battlecode-schema';
import {createGameHeader, createEventWrapper} from '../../gen/create';

function createMatch(matches: number, turnsPerMatch: number): flatbuffers.Offset {
  let builder = new flatbuffers.Builder();
  const header = createGameHeader(builder);
  let events: flatbuffers.Offset[] = [];

  events.push(createEventWrapper(builder, createGameHeader(builder), schema.Event.GameHeader));

  for (let i = 0; i < matches; i++) {
    schema.GameMap.startGameMap(builder);
    schema.GameMap.addMinCorner(builder, schema.Vec.createVec(builder, -1000, -1000));
    schema.GameMap.addMaxCorner(builder, schema.Vec.createVec(builder, 100000, 100000));
    const map = schema.GameMap.endGameMap(builder);

    schema.MatchHeader.startMatchHeader(builder);
    schema.MatchHeader.addMaxRounds(builder, turnsPerMatch);
    schema.MatchHeader.addMap(builder, map);
    events.push(createEventWrapper(builder, schema.MatchHeader.endMatchHeader(builder), schema.Event.MatchHeader));



  }

  return -1;
}
