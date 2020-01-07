# Battlecode 2020

_The formal specification of this year's game._
Current version: 2020.1.0.0

_Warning: This document and the game it describes will be tweaked as the competition progresses.
We'll try to keep changes to a minimum, but will likely have to make modifications to keep the game balanced.
Any significant changes will be done before the Seeding Tournament._

## Background

As we all know, the world is changing.
Water levels are rising, pollution is becoming a global problem, and we are rapidly depleting our most valuable natural resource: soup.
This year’s game is as much about surviving the changing climate as defeating the enemy team.

## The Game Environment

Battlecode 2020 is played by controlling **robots** on a rectangular grid called the **map**.
Two teams of robots, **red** and **blue**, roam the map.
Every **round**, each robot will get to take one **turn**, in spawn order.
More on what they can do with that turn later.

At the beginning of a match, at least one map tile will be **flooded**.
On every turn, each tile adjacent to a **flooded** tile whose **elevation** is below the **water level** will become **flooded**.
Any robot on a **flooded** tile is destroyed, except **delivery drones**.
If your **HQ** is destroyed, you lose.
As the match goes on, the **water level** will increase at an increasing rate, flooding adjacent tiles if their **elevation** is too low.
The water level at a given round is provided via the function $$e^{0.0028x-1.38\sin(0.00157x-1.73)+1.38\sin(-1.73)}-1,$$ where $x$ is the current round.
That means the following elevations will be flooded at the corresponding rounds, if adjacent to a flooded tile:

| elevation | round flooded |
| --- | --- |
| 0 | 0 |
| 1 | 256 |
| 3 | 677 |
| 5 | 1210 |
| 10 | 1771 |
| 25 | 2143 |
| 50 | 2348 |
| 100 | 2524 |
| 1000 | 3019 |


**Pollution** is the other environmental factor your robots must contend with.
The presence of pollution on a map tile will slow down any robot on that tile by an amount proportional to the amount of pollution
(see **cooldown** section for details).
There is a **global pollution** level which starts at 0, is affected by both teams, and is applied to every map tile,
plus **local pollution** from **refineries**, **cows**, and **vaporators** which can affect the pollution level near them.
(More details on the individual effects below.)

Map tiles may also contain some amount of **soup**,
which can be extracted by **miners**, as we’ll see below.

These four important characteristics of each map tile,
**elevation**, **flood** status, **pollution**, and **soup** content,
are only visible to robots which are nearby.
A robot can **sense** these characteristics if the tile is within its **sensor radius** (a trait which varies by robot type),
using the functions `rc.senseElevation()`, `rc.senseFlooded()`, `rc.sensePollution()`, and `rc.senseSoup()`, respectively.

At the beginning of the game, these characteristics and the two starting **HQ**s are guaranteed to be horizontally, vertically, or rotationally symmetric.

## Soup

**Soup** is the main resource in Battlecode 2020.
Each team has a pool of soup shared by all robots,
which is spent to build more robots and pay blockchain transaction fees.
It actually comes in two forms;
the soup distributed around the map can only be gathered by **miners** and is NOT added to the team pool until it has been **refined** in a **refinery**.
Miners must bring unrefined soup from around the map to a **refinery**, where it is processed and added to the team pool, at which point it may be spent.

Each team starts with 200 soup in the pool (`GameConstants.INITIAL_SOUP`).
There is also a base soup income of `GameConstants.BASE_INCOME_PER_ROUND`, currently set at 1, automatically added to the team pool each turn.

## Disclaimer: Distance Squared

All distances, vision radii, etc are given as the Euclidean distance squared (equal to $$dx^2 + dy^2$$, the x-offset squared plus y-offset squared).
If we say "vision radius" or "distance", we really mean "vision radius squared" or "distance squared".
There are two main benefits of doing this:
- everything is an integer, which makes life better
- taking square roots is a waste of time

Intuitions for this are best gained through a few examples:
[TODO: make a nice graphic of different distances squared, including 1, 2, 3, 4, and the vision radii of each unit]


## Robots

Each robot runs an independent copy of your code.
It acts given only its own nearby surroundings and the contents of the **blockchain**, which is described at length below.
Actions (such as **moving** or **mining**) incur a **cooldown** penalty, which varies by action, robot, and **pollution** level.
Robots can only perform actions when their cooldown is less than 1,
and performing an action adds the corresponding cooldown to the robot’s `cooldownTurns`
which can be checked with `rc.getCooldownTurns()`.

Every action has a **base cooldown** cost, but the actual **cooldown** incurred is a function of the **pollution** $$P$$ on the current tile as well.
The actual **cooldown** is equal to **base cooldown** times $$(1+ P/2000)$$.
E.g. a total pollution level of 2000 (after global and local effects) makes everything take twice as long.

All robots can **sense** their surroundings within their sensor radius. For example, you can call `rc.senseNearbyRobots` to get an array of nearby robots. For a complete reference, go to the [javadocs](https://2020.battlecode.org/javadoc/index.html).

Now, there are two types of robots, **buildings** and **units**.

### Units

**Units** are **robots** which can move.
A unit can move to a tile given all of the following constraints are met:

- the unit’s cooldown must be less than 1
- the destination tile must be adjacent to the current location (the square of 8 tiles around the robot)
- the destination tile must have elevation within +/- 3 of the current location (except for **drones**)
- the destination tile must not be occupied by another robot

We provide the `rc.canMove(Direction dir)` function to check all of these at once for a given direction.

The three producible unit types are:

**Miner**: builds buildings and extracts raw soup.

- Produced by the **HQ**.
- Can `rc.mineSoup()` to take `GameConstants.SOUP_MINING_RATE` units of soup (currently set to 7) from the map and add it to its inventory (up to `RobotType.MINER.soupLimit`, currently set to 10).
- Can use `rc.depositSoup()` to transfer soup from its inventory to an adjacent **refinery**.
- Can build **design schools** and **fulfillment centers** with `rc.buildRobot()`.

**Landscaper**: moves **dirt** around the map to adjust **elevation** and destroy buildings.

- Produced by the **design school**.
- Can perform the action `rc.digDirt()` to remove one unit of dirt from an adjacent tile,
reducing its elevation by 1 and increasing the landscaper's stored dirt by 1 up to a max of `RobotType.LANDSCAPER.dirtLimit` (currently set to 25).
This can be done if the tile is empty, **flooded**, or contains another unit, but NOT if the tile contains a **building**.
- Can perform the action `rc.depositDirt()` to reduce its stored dirt by one and place one unit of dirt onto an adjacent tile.
If the tile contains a **building**, the dirt partially buries it--the **health** of a building is how much dirt can be placed on it before it is destroyed.
If the tile is empty, flooded, or contains another unit, the only effect is that the elevation of that tile increases by 1.
- Note: this implies that buildings may never change elevation, so be careful to contain that water level.
- If enough dirt is placed on a flooded tile to raise its **elevation** above the **water level**, it becomes not flooded.

**Delivery drone**: picks up and moves units around the map.

- Produced by the **fulfillment center**
- Can move into flooded tiles without dying, but not onto other **robots**.
- Can perform the action `rc.pickUpUnit()` to pick up a single **unit** from an adjacent tile, removing it from the map, to be placed later.
- Can perform the action `rc.dropUnit()` to place the currently held **unit** on an adjacent empty or flooded tile, but not onto another **robot**.
- When a **delivery drone** is destroyed, if it is holding a unit, that unit is placed on the tile where the drone died.
- If the unit is placed on a flooded tile and is not a drone, it is destroyed as usual.
- Drones cannot pick up **buildings**, or other drones.


| unit | cost (soup) | sensor radius (squared distance) | base cooldown | produced by |
| --- | --- | --- | --- | --- |
| Miner | 70 | 35 | 1 | HQ |
| Landscaper | 150 | 24 | 1 | Design School |
| Delivery Drone | 150 | 24 | 1.5 | Fulfillment Center |


### Buildings

**Buildings** are **robots** which cannot move, and produce **units** (incurring a **cooldown** penalty as with any action).
If the team has enough **soup** to build the unit, you can use the function `rc.buildRobot` to produce it on any adjacent tile within an elevation of +/-3 of the building.
**Buildings** are completely stationary and cannot change in elevation once built.
Any dirt placed on a tile with a **building** will accumulate on that building and eventually bury it, destroying the building.
Dirt can also be removed from buildings, until there is none left, but after that dirt cannot be taken from that tile.
The net amount of dirt that must be added to a building before it is destroyed is called the building's **health**.

**Refinery**: takes soup from miners and adds it to the team shared pool, producing pollution.

- Built by **miners**
- Can store an unlimited amount of unrefined soup, inserted by miners,
and refines `min(RobotType.REFINERY.maxSoupProduced, rc.getSoupCarrying())` per turn, adding that amount to the team pool.
- Each time a nonzero amount of soup is refined, the **global pollution** level increases by 1 (`RobotType.REFINERY.globalPollutionAmount`)
and the pollution in tiles within radius squared 35 (`RobotType.REFINERY.pollutionRadiusSquared`) temporarily increases by 500 (`Robottype.REFINERY.localPollutionAdditiveEffect`).
The temporary local increase in pollution starts immediately and is in effect for exactly one round total (it ends at the beginning of this **refinery's** next turn, next round).

**Vaporator**: condenses soup from the air, reducing pollution. Clean energy!

- Built by **miners**
- Produces 7 soup (`RobotType.VAPORATOR.maxSoupProduced`) per turn for free
- Reduces **global pollution** by 1 per turn (`RobotType.VAPORATOR.globalPollutionAmount`)
- Pollution on tiles within radius squared 35 (`RobotType.VAPORATOR.pollutionRadiusSquared`) temporarily decreases by a factor of 0.67 (`RobotType.VAPORATOR.localPollutionMultiplicativeEffect`).

**Design School**: a creative institution for training talented **landscapers**.

- Built by **miners**
- Produces **landscapers**.

**Fulfillment Center**: produces **drones** and, as a byproduct of successful deliveries, fulfillment.

- Built by **miners**
- Produces **delivery drones**.

**Net Gun**: for defense against **drones**

- Built by **miners**
- Can perform the `rc.shootUnit()` action to destroy a drone within its attack radius squared of `GameConstants.NET_GUN_SHOOT_RADIUS_SQUARED` (currently 15).

**HQ**: the most important building

- Cannot be built
- Game ends when either team's HQ is destroyed
- Produces **miners**
- Has a built-in **net gun** (can shoot **drones** with `rc.shootUnit()`)
- Has a built-in **refinery** (automatically refines soup deposited by miners)

| building | cost (soup) | health | sensor radius (squared distance) | produces |
| --- | --- | --- | --- | --- |
| HQ | n/a | 50 | 48 | Miner |
| Refinery | 200 | 15 | 24 | soup |
| Vaporator | 1000 | 15 | 24 | soup |
| Design School | 150 | 15 | 24 | Landscapers |
| Fulfillment Center | 150 | 15 | 24 | Delivery Drones |
| Net Gun | 250 | 15 | 24 | failed deliveries |

### Cows

There is one final unit which cannot be built and is not controlled by any team: **cows**.
**Cows** are NPCs which produce tons of local pollution (plus 2000) in a radius squared of 15 around them.
They move around the map at random, with a base cooldown of 1.
However, cows are similar to other units:

- They die if the end up on a **flooded** tile.
- They can be picked up by **drones** (ideally, towards the enemy team).

Initial cow positions are a property of the map, and some maps may not have any.


## Communication

Robots can only see their immediate surroundings and are independently controlled by copies of your code, making coordination very challenging.
Thus, we provide a global, append-only, immutable ledger any robot can read and write to, which we call the **blockchain**\*.

The **blockchain** is a series of **blocks**, one per round, each with at most 7 **transactions**.
Each **transaction** is 7 integers, a message chosen by the sender of the transaction.
Every robot can read _all_ transactions (with `rc.getBlock()`), which are not labeled by sender or team.
(So you will need to find a way to distinguish them.)
Any robot can submit a transaction to the **transaction pool** with the function `rc.submitTransaction` and by paying, in **soup**, a **transaction fee** (think of it as a bid).
At the end of each round, the 7 transactions in the **transaction pool** with the highest **transaction fee** are removed from the pool and added to that round's **block**.
For every round thereafter, those 7 transactions are visible to all robots at all times.
Transactions which were not in the top 7 stay in the transaction pool and continue to be eligible until they are added to a block.


\*(Ok technically it's not a blockchain because it's not hash-linked, it's just a series of blocks, but otherwise it's pretty similar.)

## Bytecode Limits

Robots are also very limited in the amount of computation they are allowed to perform per **turn**.
**Bytecodes** are a convenient measure of computation in languages like Java,
where one Java bytecode corresponds roughly to one basic operation such as "subtract" or "get field",
and a single line of code generally contains several bytecodes.
(For details see http://en.wikipedia.org/wiki/Java_bytecode)
Because bytecodes are a feature of the compiled code itself, the same program will always compile to the same bytecodes and thus take the same amount of computation on the same inputs.
This is great, because it allows us to avoid using _time_ as a measure of computation, which leads to problems such as nondeterminism.
With bytecode cutoffs, re-running the same match between the same bots produces exactly the same results--a feature you will find very useful for debugging.

Every round each robot sequentially takes its turn.
If a robot attempts to exceed its bytecode limit (usually unexpectedly, if you have too big of a loop or something),
its computation will be paused and then resumed at exactly that point next turn.
The code will resume running just fine, but this can cause problems if, for example, you check if a tile is empty, then the robot is cut off and the others take their turns, and then you attempt to move into a now-occupied tile.
Instead, use the `rc.yield()` function to end a robot's turn.
This will pause computation where you choose, and resume on the next line next turn.

The per-turn bytecode limits for various robots are as follows:

- HQ: 20,000
- Net Gun: 7,000
- Other buildings: 5,000
- All units: 10,000

Some standard functions such as the math library, blockchain API, and sensing functions have fixed bytecode costs,
available [here](https://github.com/battlecode/battlecode20/blob/master/engine/src/main/battlecode/instrumenter/bytecode/resources/MethodCosts.txt).
More details on this at the end of the spec.


## Sample Player

[Examplefuncsplayer](https://github.com/battlecode/battlecode20-scaffold), a simple player which performs various game actions, is included with battlecode.
It includes helpful comments and is a template you can use to see what RobotPlayer files should look like.


## Debugging

Extremely important. See http://2020.battlecode.org/debugging to learn about our useful debug tools.


## Other Utilities


### Monitoring

The Clock class provides a way to identify the current round ( `rc.getRoundNum()` ),
and how many bytecodes have been executed during the current round ( `Clock.getBytecodeNum()` ).

### GameActionExceptions

GameActionExceptions are thrown when something cannot be done.
It is often the result of illegal actions such as moving onto another robot, or an unexpected round change in your code.
Thus, you must write your player defensively and handle GameActionExceptions judiciously.
You should also be prepared for any ability to fail and make sure that this has as little effect as possible on the control flow of your program.

Throwing any Exceptions cause a bytecode penalty of 500 bytecodes.
Unhandled exceptions may cause your robot to explode.

### Complete Documentation

Every function you could possibly use to interact with the game can be found in our [javadocs](http://2020.battlecode.org/javadoc/index.html).

## Other restrictions

### Java Language Usage

Players may use classes from any of the packages listed in `AllowedPackages.txt`, except for classes listed in `DisallowedPackages.txt`. These files can be found [here](https://github.com/battlecode/battlecode20/tree/master/engine/src/main/battlecode/instrumenter/bytecode/resources).

Furthermore, the following restrictions apply:

`Object.wait`, `Object.notify`, `Object.notifyAll`, `Class.forName`, and `String.intern` are not allowed.
`java.lang.System` only supports `out`, `arraycopy`, and `getProperty`. Furthermore, `getProperty` can only be used to get properties with names beginning with "bc.testing."
`java.io.PrintStream` may not be used to open files.

Note that violating any of the above restrictions will cause the robots to self-destruct when run, even if the source files compile without problems.


### Memory Usage

Robots must keep their memory usage reasonable. If a robot uses more than 8 Mb of heap space during a tournament or scrimmage match, the robot may explode.

### More Information on Bytecode Costs

Classes in `java.util`, `java.math`, and scala and their subpackages are bytecode counted as if they were your own code. The following functions in `java.lang` are also bytecode counted as if they were your own code.

```
Math.random
StrictMath.random
String.matches
String.replaceAll
String.replaceFirst
String.split
```

The function `System.arraycopy` costs one bytecode for each element copied. All other functions have a fixed bytecode cost. These costs are listed in the [`MethodCosts.txt` file](https://github.com/battlecode/battlecode20/blob/master/engine/src/main/battlecode/instrumenter/bytecode/resources/MethodCosts.txt). Methods not listed are free. The bytecode costs of battlecode.common functions are also listed in the javadoc.

Basic operations like integer comparison and array indexing cost small numbers of bytecodes each.

Bytecodes relating to the creation of arrays
(specifically NEWARRAY, ANEWARRAY, and MULTIANEWARRAY; see [here](https://en.wikipedia.org/wiki/Java_bytecode_instruction_listings) for reference)
have an effective cost greater than a single bytecode.
This is because these instructions, although they are represented as a single bytecode, can be vastly more expensive than other instructions in terms of computational cost.
To remedy this, these instructions now have a bytecode cost equal to the total length of the instantiated array.
Note that this change should have minimal impact on the typical team, and is only intended to prevent teams from repeatedly instantiating excessively large arrays.



# Lingering Questions/Clarifications

If something is unclear, direct your questions to our [Discord](https://discordapp.com/channels/386965718572466197/401552721095688193) where other people may have the same question.
We'll update this spec as the competition progresses.



# Changelog

- 2020.1.0.0 (1/6/20) - Initial release.
