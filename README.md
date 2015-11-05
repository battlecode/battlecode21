Battlecode Server [![Build Status](https://circleci.com/gh/battlecode/battlecode-server.svg?style=svg&circle-token=1c4becec6066bcbddddee5b3cca9d5c4b8828069)](https://circleci.com/gh/battlecode/battlecode-server)
=================

*NOTE: If you are a competitor, you can download the installer that does all these steps for you. See http://www.battlecode.org/contestants/releases/.*

Basic Guide to the Codebase
---------------------------

Inside `src/main/battlecode` you'll find all the important code for the engine:
* `common`: the simple classes available to all competitors, such as `Direction`, `Team`, and `RobotController`.
* `world`: the folder that contains most of the gameplay implementation. Here are the most important files:
  * `GameMap`: information about the game's map.
  * `GameWorld`: holds the map as well as all the robots on the map, and information about teams (such as team score).
    The core gameplay code (processing events by visiting signals and keeping track of global team stats) is here.
  * `InternalRobot`: the class that describes a single Robot and its properties (health, delays, location, etc.).
  * `RobotControllerImpl`: this implements `RobotController`. If you're wondering what happens when you call a `RobotController`.
    method, check the method's implementation here. `RobotControllerImpl` interacts heavily with `GameWorld`.
  * `XMLMapHandler`: reads the map from the XML file.
* `world/signal`: the Signals are objects that hold information about events in a game of Battlecode.
These are serialized and then transferred to the client, which processes these events and performs the
necessary updates.
* `analysis`: deprecated code that would be cool to bring back.
* `doc`: tells Javadocs how to create the documentation. `RobotDoc` is pretty important.
* `engine`: the core game engine code that handles all the robot code execution.
* `server`: contains the main class that starts up the engine.
* `serial`: contains some information that gets sent to the client as part of every match, such as who won.
