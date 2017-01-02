This repository contains the [Flatbuffers](https://google.github.io/flatbuffers/) schema files that describe the wire format of Battlecode matches. To modify the schema,
1. Update `battlecode.fbs`.
2. Run `flatc --js -o js battlecode.fbs` and `flatc --java -o java battlecode.fbs` to update the JavaScript and Java files.
3. Copy the Java files over to battlecode-server and update the dependency in battlecode-playback.
