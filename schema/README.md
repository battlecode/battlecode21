# Battlecode Schema
This repository contains the [Flatbuffers](https://google.github.io/flatbuffers/) schema files that describe the wire format of Battlecode matches.

### Spec

##### Match Files
A match file has the extension `.bc20`. It consists of a single flatbuffer with a GameWrapper at its root, containing a valid stream of Events (as described in `battlecode.fbs`). The buffer will be compressed with GZIP.

##### Network Protocol
The battlecode server hosts an unsecured websocket server on port 6175. When you connect to that port, you will receive each Event that has occurred in the current match as a separate websocket message, in order. There are no messages that can be sent from the client to the server. The server may disconnect at any time, and might not resend its messages when it does; any client has to be able to deal with a game being only half-finished over the network. Messages over the network are unsecured.

### How to update things:

1. Update `battlecode.fbs`. Only add fields to the ends of tables; don't remove or rearrange any fields. Do not edit structs.
2. Run `flatc --ts -o ts battlecode.fbs` and `flatc --java -o java battlecode.fbs` to update the TypeScript and Java files.
3. Change line 3 of `ts/battlecode_generated.ts` from `import { flatbuffers } from "./flatbuffers"` to `import { flatbuffers } from "flatbuffers"`.
4. Copy the Java files over to `../engine` and run `npm install` in both `../client/playback` and then `../client/visualizer`.

#### ADDITIONAL NOTES FOR 2020+:
Since flatbuffers has upgraded and seem to not be very back compatible, make the following manual changes to any generated java files before moving them to the engine folder:

1. Within the generated class, at the top, there will be four lines that resemble below:
```java
public static TeamData getRootAsTeamData(ByteBuffer _bb) { return getRootAsTeamData(_bb, new TeamData()); }
public static TeamData getRootAsTeamData(ByteBuffer _bb, TeamData obj) { _bb.order(ByteOrder.LITTLE_ENDIAN); return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb)); }
public void __init(int _i, ByteBuffer _bb) { bb_pos = _i; bb = _bb; vtable_start = bb_pos - bb.getInt(bb_pos); vtable_size = bb.getShort(vtable_start); }
public TeamData __assign(int _i, ByteBuffer _bb) { __init(_i, _bb); return this; }
```
Change this to three lines of the following format:
```java
public static TeamData getRootAsTeamData(ByteBuffer _bb) { return getRootAsTeamData(_bb, new TeamData()); }
public static TeamData getRootAsTeamData(ByteBuffer _bb, TeamData obj) { _bb.order(ByteOrder.LITTLE_ENDIAN); return (obj.__init(_bb.getInt(_bb.position()) + _bb.position(), _bb)); }
public TeamData __init(int _i, ByteBuffer _bb) { bb_pos = _i; bb = _bb; return this; }
```
In other words, the first line remains the same, replace `__assign` with `__init` in the second and fourth line, delete the third line, and replace `__init(_i, _bb);` in the fourth line with `bb_pos = _i; bb = _bb;`.

2. For some of the fields, you may see something like the below:
```java
public String name() { int o = __offset(4); return o != 0 ? __string(o + bb_pos) : null; }
public ByteBuffer nameAsByteBuffer() { return __vector_as_bytebuffer(4, 1); }
public ByteBuffer nameInByteBuffer(ByteBuffer _bb) { return __vector_in_bytebuffer(_bb, 4, 1); }
```
Specifically, look for `fieldAsByteBuffer()` and `fieldInByteBuffer(ByteBuffer _bb)`. In this case, delete the last line, which contains `fieldInByteBuffer(ByteBuffer _bb)`. You will arrive at something like this:
```java
public String name() { int o = __offset(4); return o != 0 ? __string(o + bb_pos) : null; }
public ByteBuffer nameAsByteBuffer() { return __vector_as_bytebuffer(4, 1); }
```

3. For array fields, the generated file will contain something like this:
```java
public BodyTypeMetadata bodyTypeMetadata(int j) { return bodyTypeMetadata(new BodyTypeMetadata(), j); }
public BodyTypeMetadata bodyTypeMetadata(BodyTypeMetadata obj, int j) { int o = __offset(8); return o != 0 ? obj.__assign(__indirect(__vector(o) + j * 4), bb) : null; }
public int bodyTypeMetadataLength() { int o = __offset(8); return o != 0 ? __vector_len(o) : 0; }
```
Replace every case of `__assign` with `__init`. This will result in something like this:
```java
public BodyTypeMetadata bodyTypeMetadata(int j) { return bodyTypeMetadata(new BodyTypeMetadata(), j); }
public BodyTypeMetadata bodyTypeMetadata(BodyTypeMetadata obj, int j) { int o = __offset(8); return o != 0 ? obj.__init(__indirect(__vector(o) + j * 4), bb) : null; }
public int bodyTypeMetadataLength() { int o = __offset(8); return o != 0 ? __vector_len(o) : 0; }
```

#### OLD, 2017, WAY BELOW:

In the new way, we pull flatbuffers from npm as TypeScript directly, instead of having a local copy in JavaScript that we then need to convert into TypeScript manually. This is much nicer, and allows us to skip 1 step. It does require, however, that anyone using the battlecode schema also imports `@typings/flatbuffers` from npm.

1. Update `battlecode.fbs`. Only add fields to the ends of tables; don't remove or rearrange any fields. Do not edit structs.
2. Run `flatc --ts -o ts battlecode.fbs` and `flatc --java -o java battlecode.fbs` to update the JavaScript and Java files.
3. Copy the Java files over to `../engine` and run `npm install` in both `../client/playback` and then `../client/visualizer`.
