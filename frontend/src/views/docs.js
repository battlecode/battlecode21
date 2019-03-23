import React, { Component } from 'react';
import SPECS from 'bhse19/specs';
import styled from 'styled-components';

const He = styled.h5`
  font-weight: bold;
  font-size:1.3em;
`;

const Hee = styled.h5`
  text-decoration:underline;
  font-size:1.2em;
`;

class Docs extends Component {
    render() {
        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Battlecode: Voyage Official Game Specs</h4>
                                    <p className="category">Updated 3/20/19 5:00PM EST</p>
                                </div>
                                <div className="content">
                                    <p>Human civilization on Earth has reached its termination. Fortunately, decades of effort by astronauts, scientists, and engineers seem to have been wildly fruitful, as the explorers they sent into outer space have thrived in their respective landing locations. Inhabitants of the Red Planet — the Zulu Marauders — have regressed to a medieval lifestyle in outer space, living by a feudal system.
                                        Inhabitants of the Blue Planet — the Space Marines — are intent on funneling all resources toward researching the ocean life around them. Although both have made countless attempts to build one society, there is no compromising with the Zulu Marauders and Space Marines.
                                        With their irreconcilable differences, both civilizations have decided to completely part ways and build separate lives. However, they both have found galactical <b>Orbs</b> to be extremely valuable, and are intent on gathering as many as possible. As a Zulu Marauder or Space Marine, you must send out <b>Voyagers</b> to explore your area and amass the material around you — specifically, to collect valuable <b>Orbs</b> — to build your society. </p>
                                    <He>Game Format</He>
                                    <p>Battlecode: Voyage is a two-player turn-based game, where <b>Voyagers</b> on a 
                                    tiled grid are each controlled by individual computer programs. 
                                    The objective of the game is to end up with more <b>Orbs</b> than the opponent  
                                    after { SPECS.MAX_ROUNDS } rounds. Orbs are collected by the law of gravity in tiled spaces (i.e., Manhattan distance). Each civilization has a single <b>Planet</b> that 
                                    can spawn <b>Voyagers</b>. If by { SPECS.MAX_ROUNDS } rounds both the Zulu Marauders 
                                    and the Space Marines have amassed the same number of <b>Orbs</b>, the tie is broken by the existing number of units and a coin toss, in that order.</p>
                                    <He>Map</He>
                                    <p>Game maps are procedurally generated, and are square 2D grids ranging between { SPECS.MIN_BOARD_SIZE }x{ SPECS.MIN_BOARD_SIZE } and { SPECS.MAX_BOARD_SIZE }x{ SPECS.MAX_BOARD_SIZE } tiles. Every map is either horizontally or vertically symmetric, and the top left corner has the coordinates (0, 0). Each tile in the map is either passable or impassable; passable tiles are light gray, while obstacles (spaceship corpses from previous exploration, large asteroids, other debris not collectable by the small <b>Voyagers</b>) are black. 
                                    All units have full knowledge of the map from the beginning.
                                    Both teams start with one <b>Planet</b>, located at symmetric positions on the map. </p>
                                    <He>Orbs</He>
                                    <p>The map is overlaid with a grid of <b>Orb</b> counts; each tile contains an 
                                    integral number of <b>Orbs</b> between { SPECS.MIN_CELL_KARBONITE } and { SPECS.MAX_CELL_KARBONITE } (inclusive). 
                                    Impassable tiles have 0 <b>Orbs</b>. The <b>Orbs</b> count is constant throughout the entire game, and is known by all units from the start.
                                    </p><p>At the end of each round, each <b>Voyager</b> will use their own 
                                    gravitational field to pick up all <b>Orbs</b> that are closer to them than to all other <b>Voyagers</b> (in Manhattan distance). 
                                    That is, the total number of <b>Orbs</b> collected in a round for one civilization will be the sum of the <b>Orbs</b> values of all tiles that are closer to any of the civilization's <b>Voyagers</b> than to all of the opposing 
                                    teams <b>Voyagers</b>. <b>Planets</b> have too small mass to affect the gravitational field, and thus cannot collect <b>Orbs</b>.
                                    Neither civilization collects the <b>Orbs</b> of tiles that are equally close to their closest <b>Voyagers</b> of each civilization.
                                    Note that the <b>Orbs</b>-assignment process is equivalent to dividing the grid into regions based on the <a target="_blank" href="https://en.wikipedia.org/wiki/Voronoi_diagram#Illustration">Manhattan-distance Voronoi diagram</a>. 
                                    </p>
                                    <He>Units</He>
                                    <p>Each unit is initialized with a { SPECS.CHESS_INITIAL }ms chess clock, and receives { SPECS.CHESS_EXTRA }ms of additional computation each round. Each turn is additionally capped at { SPECS.TURN_MAX_TIME }ms, after which the code will be stopped. If a robot exceeds its chess clock, it cannot move until it has a positive amount of time in its clock. </p>
                                    <p><b>Voyagers</b> can move 1 step in the 4 cardinal directions (North, South, East, West). However, <b>Voyagers</b> cannot move to a tile that is directly adjacent to another <b>Voyager</b> of the same team (diagonals inclusive). </p>
                                    <p><b>Planets</b> are Voyager factories; they can produce more <b>Voyagers</b> to send out into space, but doing so will cost the civilization { SPECS.UNITS[SPECS.VOYAGER].CONSTRUCTION_KARBONITE } <b>Orbs</b> per <b>Voyager</b>.</p>
                                    <p>Each unit has a unique { SPECS.MAX_ID }-bit integer ID and a vision radius that allows them to see any other unit within a <i>squared</i> radius
                                      of { SPECS.UNITS[SPECS.VOYAGER].VISION_RADIUS }. This means that a unit at position <code>(r,c)</code> can see another unit at position <code>(r',c')</code> if and only if <code>(r-r')^2 + (c-c')^2 {"<="} { SPECS.UNITS[SPECS.VOYAGER].VISION_RADIUS }</code>. 
                                      <a href="../../assets/img/voyager_vision.png"> Here is a picture</a> showing the visible regions (note that the same is true for <b>Planets</b> as well as for <b>Voyagers</b>).</p>
                                    
                                    <He>Communication</He>
                                    <p>In any given turn, a <b>Voyager</b> or <b>Planet</b> can 
                                    broadcast a { SPECS.COMMUNICATION_BITS }-bit message to all other units 
                                    (including the opponent's units) on the map. 
                                    Until the broadcasting unit's next turn, all units will see the signal broadcasted by it.
                                    If a unit does not signal in a given turn, its broadcasted message will be reset to 0.
                                    Units can radio broadcast simultaneously with all other actions.</p>
                                    <He>Turn Queue</He>
                                    <p>Battlecode: Voyage games consist of exactly { SPECS.MAX_ROUNDS } rounds,
                                     and each round consists of a turn for every unit on the board. 
                                     This is acheived by cycling each round through a queue that 
                                     consists of all units on the map. The queue is 
                                     initialized with each team’s <b>Planets</b> in alternating red, blue order. 
                                     Then, whenever a <b>Planet</b> produces a new <b>Voyager</b>, it is 
                                     added to the end of the turn queue as soon as the <b>Planet's</b> turn ends. 
                                     To rephrase, <b>Voyagers</b> built in a round will get a turn in the same round. 
                                     A round consists of a full pass through the turn queue.</p>

                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Javascript Bot Reference</h4>
                                    <p className="category">Updated 3/9/19 3:50PM EST</p>
                                </div>
                                <div className="content">
                                    <p>Below is an example of a simple bot. If it is a Voyager, it moves randomly, and if it is a Planet,
                                        it tries to build as soon as it can.
                                    </p>
                                    <pre>{`import {BCAbstractRobot, SPECS} from 'battlecode';

class MyRobot extends BCAbstractRobot {
    turn() {

        if (this.me.unit === SPECS.VOYAGER) {
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            return this.move(choice[0], choice[1]);
        }

        else if (this.me.unit === SPECS.PLANET) {
            if (this.orbs >= 65536) {
                return this.buildUnit(0, 1)
            }
        }

    }
}

var robot = new MyRobot();`}</pre>
                                    <p>The main container of your bot code is the <code>MyRobot</code> class,
                                    which must be a subclass of <code>BCAbstractRobot</code>.</p>
                                    <p>When your bot is spawned, a <code>MyRobot</code> object is
                                    created in its own global scope (meaning that you can use global variables, but that they will not be shared between bots).
                                    For every turn, the <code>turn()</code> method of your class is called.
                                    This is where the heart of your robot code lives.
                                    If you want the robot to perform an action, the <code>turn()</code> method should return it.</p>
                                    <p>Note that the same <code>MyRobot</code> class is used
                                    for all units. Some API methods will only be available for some units,
                                    and will throw an error if called by unallowed units.</p>
                                    <p>You can change the name of the
                                        <code>MyRobot</code> class, as long as you update the <code>var robot = new MyRobot();</code> line.</p>
                                    <hr /><h6>State Information</h6><hr />
                                    <ul>
                                        <li><code>this.me</code>: The robot object (see below) for this robot.</li>
                                        <li><code>this.map</code>: The full map. Boolean grid where <code>true</code> indicates passable and <code>false</code> indicates impassable. Indexed <code>[r][c]</code> (row, column), with <code>[0][0]</code> being the upper left corner.</li>
                                        <li><code>this.orbs_map</code>: The Orbs map. Grid with integer values indicating how much orbs are present at each position. Indexed in the same way as <code>this.map</code>.</li>
                                        <li><code>this.n</code>: The size of the map. </li>
                                        <li><code>this.orbs</code>: The total amount of Orbs that the team possesses.</li>
                                        <li><code>this.robots</code>: All units that exist (including <code>this.me</code>), in random order.</li>
                                    </ul>
                                    <hr /><h6>The Robot Object</h6><hr />
                                    <p style={{fontSize: '14px'}}>Let <code>r</code> be any robot object (e.g., <code>r = this.me</code> or <code>r = this.robots[1]</code>).</p>
                                    <p style={{fontSize: '14px'}}>The following properties are available for all robots:</p>
                                    <ul>
                                        <li><code>r.id</code>: The id of the robot, which is an integer between 1 and {SPECS.MAX_ID}.</li>
                                        <li><code>r.unit</code>: The robot's unit type, where { SPECS.PLANET } stands for Planet and { SPECS.VOYAGER } stands for Voyager.</li>
                                        <li><code>r.signal</code>: The current signal of the robot.</li>
                                    </ul>
                                    <p style={{fontSize: '14px'}}>The following properties are available if the robot is visible (that is, if <code>isVisible(r)</code> is <code>true</code>).</p>
                                    <ul>
                                        <li><code>r.team</code>: The team of the robot, where {SPECS.RED} stands for RED and {SPECS.BLUE} stands for BLUE.</li>
                                        <li><code>r.r</code>: The position of the robot in the North-South direction (the row that the robot is in).</li>
                                        <li><code>r.c</code>: The position of the robot in the East-West direction (the column that the robot is in).</li>
                                    </ul>
                                    <p style={{fontSize: '14px'}}> In addition, the following properties are available if <code>r = this.me</code>.</p>
                                    <ul>
                                        <li><code>r.turn</code>: The turn count of the robot (initialiazed to 0, and incremented just before <code>turn()</code>).</li>
                                        <li><code>r.time</code>: The chess clock's value at the start of the turn, in ms.</li>

                                    </ul>
                                    <hr /><h6>Actions</h6><hr />
                                    <p style={{fontSize: '14px'}}>The following is a list of methods that can be returned in <code>turn()</code>, to perform an action. Note that the action will only be performed if it is returned. </p>
                                    <ul>
                                        <li><code>this.move(dr, dc)</code>: Move <code>dr</code> steps in the North-South direction, and <code>dc</code> steps in the East-West direction. Only Voyagers can move.</li>
                                        <li><code>this.buildUnit(dr, dc)</code>: Build a Voyager in the tile that is <code>dr</code> steps in the North-South direction and <code>dc</code> steps in the East-West direction from <code>this.me</code>. Can only build in adjacent, empty and passable tiles.
                                        Uses <code>{SPECS.UNITS[1].CONSTRUCTION_KARBONITE}</code> Orbs. Only Planets can build.</li>
                                    </ul>
                                    <hr /><h6>Communication</h6><hr />
                                    <ul>
                                        <li><code>this.signal(value)</code>: Broadcast <code>value</code> to all robots. The <code>value</code> should be an integer between <code>0</code> and <code>2^{SPECS.COMMUNICATION_BITS}-1</code> (inclusive). Can be called multiple times in one <code>turn()</code>; however, only the most recent signal will be used. </li>
                                    </ul>
                                    <hr /><h6>Helper Methods</h6><hr />
                                    <ul>
                                        <li><code>this.log(message)</code>: Print a message to the command line.  You cannot use ordinary <code>console.log</code> in Battlecode for security reasons.</li>
                                        <li><code>this.getVisibleRobotMap()</code>: Returns a 2d grid of integers the size of <code>this.map</code>. All tiles outside <code>this.me</code>'s vision radius will contain <code>-1</code>. All tiles within the vision will be <code>0</code> if empty, and will be a robot id if it contains a robot.</li>
                                        <li><code>this.getRobot(id)</code>: Returns a robot object with the given integer <code>id</code>.  Returns <code>null</code> if such a robot is not in your vision radius.</li>
                                        <li><code>this.isVisible(id)</code>: Returns <code>true</code> if and only if the robot identified by <code>id</code> is within <code>this.me</code>'s vision radius (particularly, <code>this.me</code> is always visible to itself). </li>
                                    </ul>
                                </div>
                            </div>


                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Docs;
