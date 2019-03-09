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
                                    <h4 className="title">Battlecode: Crusade Official Game Specs</h4>
                                    <p className="category">Updated 3/9/19 3:50PM EST</p>
                                </div>
                                <div className="content">
                                    <p>Human civilization on Earth is in ruins. Decades of effort by astronauts, scientists, and engineers seem to have gone down the drain, as the explorers they had sent into outer space and put so much hope in are now hopelessly divided. Inhabitants of the Orange Planet - the Zulu Marauders - have regressed to a medieval lifestyle in outer space, living by a feudal system. Inhabitants of the Purple Planet - the Space Marines - are intent on funneling all resources toward weapon research and development. With their irreconcilable differences, the only way to achieve ultimate peace is total war. Before any missiles are unleashed however, both societies must send <b><b>Voyagers</b></b> out to explore their area and amass the material around them - specifically, to collect valuable <b>Orbs</b> that can be used to rebuild their societies. </p>
                                    <He>Game Format</He>
                                    <p>Battlecode: Voyage is a two-player turn-based game, where <b>Voyagers</b> on a tiled grid are each controlled by individual computer programs. The objective of the game is to end up with more <b>Orbs</b> than the opponent. Each civilization has a single <b>Planet</b> that can spawn <b>Voyagers</b>. If by 256 rounds both the Zulu Marauders and the Space Marines have amassed the same number of <b>Orbs</b>, the tie is broken by the existing number of units and a coin toss, in that order.</p>
                                    <He>Map and Resources Overview</He>
                                    <p>Game maps are procedurally generated, and are square 2D grids ranging between 30x30 and 40x40 tiles. Every map is either horizontally or vertically symmetric, and the top left corner has the coordinates (0, 0). Each tile in the map is either passable or impassable; passable tiles are light gray, while obstacles (spaceship corpses from previous exploration, large asteroids, other debris not collectable by the small <b>Voyagers</b>) are black. Each teams starts with one <b>Planet</b> and one <b>Voyager</b>.</p>
                                    <p>The map is overlaid with a grid of <b>Orb</b> counts; each tile contains an integral number of <b>Orbs</b> between 0 and 7 (inclusive). This value is constant throughout the entire game.</p>
                                    <p>Robots have knowledge of the full map at the beginning of the game (including passable/impassable terrain, <b>Orb</b> values, and <b>Planet</b> locations).
                                    </p>
                                    <He>Units Overview</He>
                                    <p>Each <b>Voyager</b> is initialized with a 100ms chess clock, and receives 20ms of additional computation each round. Each turn is additionally capped at 200ms, after which the code will be stopped. If a robot exceeds its chess clock, it cannot move until it has > 0 time in its clock. </p>
                                    <p>Movement in the 4 cardinal directions (North, South, East, West) is allowed. Each <b>Voyager</b> has a unique 32-bit integer ID and a vision radius that allows them to see any other <b>Voyagers</b> within two tiles of itself (24 tiles of vision total, excluding its own tile). </p>
                                    <p><b><b>Planet</b>s</b> are 2x2 “Voyager factories”; they can produce more <b>Voyagers</b> to send out into space, but doing so will cost them 65536 <b>Orbs</b> per <b>Voyager</b>.</p>
                                    <He>Communication</He>
                                    <p>In any given turn, a <b>Voyager</b> or <b>Planet</b> can broadcast a 16-bit message to all other units (including the opponent’s units) on the map. On the next round, all units within that radius will see that that a <b>Planet</b> or <b>Voyager</b> of the sender’s ID broadcasted the given message (from its new position, if the unit moved). Units can radio broadcast simultaneously with all other actions. Note that robots can see the unit ID and x, y location that produced a broadcast, but not which team the unite belongs to.</p>
                                    <He>Turn Queue</He>
                                    <p>Battlecode: Voyage games consist of up to 256 rounds, and each round consists of a turn for every unit on the board. This is acheived by cycling each round through a queue that consists of all units on the map. The queue is initialized with each team’s <b><b>Planet</b>s</b> in alternating orange, purple order. Then, whenever a <b>Planet</b> produces a new Voyager, it is added to the end of the turn queue as soon as the <b>Planet</b>’s turn ends. To rephrase, <b>Voyagers</b> built in a round will get a turn in the same round. A round consists of a full pass through the turn queue.</p>

                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Javascript Bot Reference</h4>
                                    <p className="category">Updated 1/7/19 7:00PM EST</p>
                                </div>
                                <div className="content">
                                    <p>Javascript is the primary language supported by Battlecode Crusade, and the target all other languages are compiled to, so it's a great choice to develop a bot in (especially for beginners).  Below is a bare minimum bot example:</p>
                                    <pre>{`import {BCAbstractRobot, SPECS} from 'battlecode';

var step = -1;

class MyRobot extends BCAbstractRobot {
    turn() {
        step++;

        if (this.me.unit === SPECS.CRUSADER) {
            // this.log("Crusader health: " + this.me.health);
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            return this.move(...choice);
        }

        else if (this.me.unit === SPECS.CASTLE) {
            if (step % 10 === 0) {
                this.log("Building a crusader at " + (this.me.x+1) + ", " + (this.me.y+1));
                return this.buildUnit(SPECS.CRUSADER, 1, 1);
            } else {
                return // this.log("Castle health: " + this.me.health);
            }
        }

    }
}

var robot = new MyRobot();`}</pre>
                                    <p>The main container of your bot code is the <code>MyRobot</code> class, which must be a subclass of <code>BCAbstractRobot</code>. <code>BCAbstractRobot</code> contains all sorts of useful methods that will make developing your bot easier.</p>
                                    <p>When your bot is spawned, a <code>MyRobot</code> object is created in its own global scope. For every turn, the <code>turn()</code> method of your class is called.  This is where the heart of your robot code lives. If you want the robot to perform an action, the <code>turn()</code> method should return it.</p>
                                    <p>Note that the same <code>MyRobot</code> class is used for all units. Some API methods will only be available for some units, and will throw an error if called by unallowed units.</p>
                                    <p>You can change the name of the <code>MyRobot</code> class, as long as you update the <code>var robot = new MyRobot();</code> line.</p>
                                    <hr /><h6>State Information</h6><hr />
                                    <ul>
                                        <li><code>this.me</code>: The robot object (see below) for this robot.</li>
                                        <li><code>this.map</code>: The full map. Boolean grid where <code>true</code> indicates passable and <code>false</code> indicates impassable. Indexed <code>[y][x]</code>, like all 2D arrays in Battlecode.</li>
                                        <li><code>this.<b>Orb</b>s_map</code>: The <b>Orb</b>s map. Grid with integer values indicating how much <b>Orb</b>s are present there. </li>
                                        <li><code>this.<b>Orb</b>s</code>: The global amount of <b>Orb</b>s that the team possesses.</li>
                                        <li><code>this.robots</code>: All units that exist (including <code>this.me</code>), in random order.</li>
                                    </ul>
                                    <hr /><h6>The Robot Object</h6><hr />
                                    <p>In the following list, assume that <code>r</code> is a robot object (e.g., <code>r = this.me</code> or <code>r = this.robots[1]</code>).</p>
                                    <p>The following properties are available for all robots:</p>
                                    <ul>
                                        <li><code>r.id</code>: The id of the robot, which is an integer between 1 and {SPECS.MAX_ID}. Always available.</li>
                                        <li><code>r.unit</code>: The robot's unit type, where { SPECS.CASTLE } stands for Castle, { SPECS.CHURCH } stands for Church, { SPECS.PILGRIM} stands for Pilgrim, {SPECS.CRUSADER} stands for Crusader, {SPECS.PROPHET} stands for Prophet and {SPECS.PREACHER} stands for Preacher. Available if visible.</li>
                                        <li><code>r.health</code>: The health of the robot. Only available for <code>r = this.me</code>.</li>
                                        <li><code>r.team</code>: The team of the robot, where {SPECS.RED} stands for RED and {SPECS.BLUE} stands for BLUE. Available if visible, or you are a castle. </li>
                                        <li><code>r.x</code>: The x position of the robot. Available if visible or within radio range. </li>
                                        <li><code>r.y</code>: The y position of the robot. Available if visible or within radio range. </li>
                                        <li><code>r.karbonite</code>: The amount of Karbonite that the robot carries. Only available for <code>r = this.me</code>.</li>
                                        <li><code>r.turn</code>: The turn count of the robot (initialiazed to 0, and incremented just before <code>turn()</code>). Always available.</li>
                                        <li><code>r.signal</code>: The signal of the robot. Available if radioable.</li>
                                        <li><code>r.time</code>: The chess clock's value at the start of the turn, in ms.  Only available if <code>r == this.me</code>.</li>

                                    </ul>
                                    <p>Visible means that <code>r</code> is within <code>this.me</code>'s vision radius (particularly, <code>this.me</code> is always visible to itself). Radioable means that <code>this.me</code> is within <code>r</code>'s signal radius. </p>
                                    <hr /><h6>Actions</h6><hr />
                                    <p>The following is a list of methods that can be returned in <code>turn()</code>, to perform an action. Note that the action will only be performed if it is returned; thus, only one of these actions can be performed per turn. </p>
                                    <ul>
                                        <li><code>this.move(dx, dy)</code>: Move <code>dx</code> steps in the x direction, and <code>dy</code> steps in the y direction. Uses Fuel (depending on unit and distance). Available for Pilgrims, Crusaders, Prophets, Preachers. </li>
                                        <li><code>this.mine()</code>: Mine { SPECS.KARBONITE_YIELD } Karbonite or { SPECS.FUEL_YIELD } Fuel, if on a corresponding resource tile. Uses { SPECS.MINE_FUEL_COST } Fuel. Available for Pilgrims. </li>
                                        <li><code>this.give(dx, dy, karbonite, fuel)</code>: Give <code>karbonite</code> Karbonite and <code>fuel</code> Fuel to the robot in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>this.me</code>. A robot can only give to another robot that is in one of its 8 adjacent tiles, and cannot give more than it has. Uses 0 Fuel. Available for all robots.  If a unit tries to give a robot more than its capacity, the excess is loss to the void.</li>
                                        <li><code>this.attack(dx, dy)</code>: Attack the robot in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>this.me</code>. A robot can only attack another robot that is within its attack radius (depending on unit). Uses Fuel (depending on unit). Available for Crusaders, Prophets, Preachers. </li>
                                        <li><code>this.buildUnit(unit, dx, dy)</code>: Build a unit of the type <code>unit</code> (integer, see <code>r.unit</code>) in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>this.me</code>. Can only build in adjacent, empty and passable tiles. Uses Fuel and Karbonite (depending on the constructed unit). Available for Pilgrims, Castles, Churches. Pilgrims can only build Churches, and Castles and Churches can only build Pilgrims, Crusaders, Prophets and Preachers.</li>
                                        <li><code>this.proposeTrade(karbonite, fuel)</code>: Propose a trade with the other team. <code>karbonite</code> and <code>fuel</code> need to be integers. For example, for RED to make the offer "I give you 10 Karbonite if you give me 10 Fuel", the parameters would be <code>karbonite = 10</code> and <code>fuel = -10</code> (for BLUE, the signs are reversed). If the proposed trade is the same as the other team's <code>last_offer</code>, a trade is performed, after which the <code>last_offer</code> of both teams will be nullified. Available for Castles.</li>
                                    </ul>
                                    <hr /><h6>Communication</h6><hr />
                                    <ul>
                                        <li><code>this.signal(value, sq_radius)</code>: Broadcast <code>value</code> to all robots within the squared radius <code>sq_radius</code>. Uses <code>Math.ceil(Math.sqrt(sq_radius))</code> Fuel. <code>value</code> should be an integer between <code>0</code> and <code>2^{SPECS.COMMUNICATION_BITS}-1</code> (inclusive). Can be called multiple times in one <code>turn()</code>; however, only the most recent signal will be used, while each signal will cost Fuel. </li>
                                        <li><code>this.castleTalk(value)</code>: Broadcast <code>value</code> to all Castles of the same team. Does not use Fuel. <code>value</code> should be an integer between <code>0</code> and <code>2^{SPECS.CASTLE_TALK_BITS}-1</code> (inclusive). Can be called multiple times in one <code>turn()</code>; however, only the most recent castle talk will be used. </li>
                                    </ul>
                                    <hr /><h6>Helper Methods</h6><hr />
                                    <ul>
                                        <li><code>this.log(message)</code>: Print a message to the command line.  You cannot use ordinary <code>console.log</code> in Battlecode for security reasons.</li>
                                        <li><code>this.getVisibleRobots()</code>: Returns a list containing all robots within <code>this.me</code>'s vision radius and all robots whose radio broadcasts can be heard (accessed via <code>other_r.signal</code>). For castles, robots of the same team not within the vision radius will also be included, to be able to read the <code>castle_talk</code> property. </li>
                                        <li><code>this.getVisibleRobotMap()</code>: Returns a 2d grid of integers the size of <code>this.map</code>. All tiles outside <code>this.me</code>'s vision radius will contain <code>-1</code>. All tiles within the vision will be <code>0</code> if empty, and will be a robot id if it contains a robot. </li>
                                        <li><code>this.getRobot(id)</code>: Returns a robot object with the given integer <code>id</code>.  Returns <code>null</code> if such a robot is not in your vision (for Castles, it also returns a robot object for all robots on <code>this.me</code>'s team that are not in the robot's vision, to access <code>castle_talk</code>).</li>
                                        <li><code>this.isVisible(robot)</code>: Returns <code>true</code> if the given robot object is visible.</li>
                                        <li><code>this.isRadioing(robot)</code>: Returns <code>true</code> if the given robot object is currently sending radio (signal).</li>
                                        <li><code>this.getPassableMap()</code>: Returns <code>this.map</code>. </li>
                                        <li><code>this.getKarboniteMap()</code>: Returns <code>this.karbonite_map</code>. </li>
                                        <li><code>this.getFuelMap()</code>: Returns <code>this.fuel_map</code>. </li>

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
