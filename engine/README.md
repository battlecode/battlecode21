Battlecode Engine
=================

If you're a competitor, you don't need to be here.

Unless you're a hacker.

Basic Guide to Building
-----------------------
Java 1.8 is required. Make sure you have the `JAVA_HOME` environment variable set to the appropriate value for your system.

1. `./gradlew build` - to build
2. `./gradlew javadoc` - to make javadocs
3. `./gradlew test` - to run tests

For Mac, `JAVA_HOME` is probably something similar to `/Library/Java/JavaVirtualMachines/jdk1.8.0_111.jdk/Contents/Home`.

Basic Guide to the Codebase
---------------------------

Inside `src/main/battlecode` you'll find all the important code for the engine:
* `common`: the simple classes available to all competitors, such as `Direction`, `Team`, and `RobotController`.
* `world`: the folder that contains most of the gameplay implementation. Here are the most important files:
  * `GameMap`: information about the game's map.
  * `GameWorld`: holds the map as well as all the robots on the map, and information about teams (such as team score).
    The core gameplay code (processing events by visiting signals and keeping track of global team stats) is here.
  * `InternalRobot`: the class that describes a single Robot and its properties (delays, location, etc.).
  * `RobotControllerImpl`: this implements `RobotController`. If you're wondering what happens when you call a `RobotController`.
    method, check the method's implementation here. `RobotControllerImpl` interacts heavily with `GameWorld`.
  * `XMLMapHandler`: reads the map from the XML file.
* `world/signal`: the Signals are objects that hold information about events in a game of Battlecode.
These are serialized and then transferred to the client, which processes these events and performs the
necessary updates.
* `analysis`: deprecated code that would be cool to bring back.
* `doc`: tells Javadocs how to create the documentation. `RobotDoc` is pretty important.
* `instrumenter`: handles instrumenting player code so that it is isolated, deterministic, and counts bytecodes.
  * `instrumenter/bytecode`: the actual bytecode-modification code.
  * `instrumenter/inject`: classes we replace various parts of java.lang with. Also contains RobotMonitor, which counts bytecodes.
  * `instrumenter/profiler`: contains the bytecode profiler.
* `server`: contains the main class that starts up the engine.
* `serial`: contains some information that gets sent to the client as part of every match, such as who won.
