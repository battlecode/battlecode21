# Battlecode Schema
This repository contains the [Flatbuffers](https://google.github.io/flatbuffers/) schema files that describe the wire format of Battlecode matches.

### Spec

##### Match Files
A match file has the extension `.bc17`. It consists of a single flatbuffer with a GameWrapper at its root, containing a valid stream of Events (as described in `battlecode.fbs`). The buffer will be compressed with GZIP.

##### Network Protocol
The battlecode server hosts an unsecured websocket server on port 6175. When you connect to that port, you will receive each Event that has occurred in the current match as a separate websocket message, in order. There are no messages that can be sent from the client to the server. The server may disconnect at any time, and might not resend its messages when it does; any client has to be able to deal with a game being only half-finished over the network. Messages over the network are unsecured.

### How to update things:
1. Update `battlecode.fbs`. Only add fields to the ends of tables; don't remove or rearrange any fields. Do not edit structs.
2. Run `flatc --js -o js battlecode.fbs` and `flatc --java -o java battlecode.fbs` to update the JavaScript and Java files.
3. Edit `js/index.d.ts` with the added functions and classes in `js/battlecode_generated.js` so typescript knows about things.
4. Copy the Java files over to battlecode-server and update the dependency in battlecode-playback.
