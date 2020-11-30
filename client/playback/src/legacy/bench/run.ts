import {readFileSync} from 'fs';
import {crunch} from '../simulator';
import {schema, flatbuffers} from 'battlecode-schema';

const wrapper = schema.GameWrapper.getRootAsGameWrapper(
  new flatbuffers.ByteBuffer(new Uint8Array(readFileSync('test.bc20')))
);

crunch(wrapper);
