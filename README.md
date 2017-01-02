This repository contains the [Flatbuffers](https://google.github.io/flatbuffers/) schema files that describe the wire format of Battlecode matches. To modify the schema,
1. Update `battlecode.fbs`.
2. Run `flatc --js -o js battlecode.fbs` and `flatc --java -o java battlecode.fbs` to update the JavaScript and Java files.
3. Edit `js/index.d.ts` with the added functions and classes in `js/battlecode_generated.js` so typescript knows about things.
4. Copy the Java files over to battlecode-server and update the dependency in battlecode-playback.
