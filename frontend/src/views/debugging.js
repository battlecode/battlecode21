import React, { Component } from 'react';
import styled from 'styled-components';

const He = styled.h5`
  font-weight: bold;
  font-size:1.3em;
`;

const Hee = styled.h5`
  text-decoration:underline;
  font-size:1.2em;
`;

class Debugging extends Component {

  constructor() {
    super();

    this.state = {
        ide: "intellij"
    }

  }


  intellijButton = () => {
      this.setState({ide: "intellij"})
  }
  eclipseButton = () => {
      this.setState({ide: "eclipse"})
  }

  getSelectionButtons(ide) {
      var l = "btn btn-secondary ide-button-getting-started"
      if (ide === this.state.ide) {
            l += " selected-ide-button"
      }
      return l;
  }

  getIDEInstallation() {
      if (this.state.ide === 'intellij') {
          return (
              <div>
<h4 id="debugging-in-intellij">Debugging in Intellij</h4>
<h5 id="initial-setup">Initial setup</h5>
<ul>
<li>Go into IntelliJ</li>
<li>Set a breakpoint by clicking on the area beside the line numbers to the left of your code.</li>
<li>Right click the breakpoint and select <code>Suspend / Thread</code>, and then click “Make default.” (This lets battlecode keep working while your code is paused.)</li>
<li>Go to Run &gt; Edit Configurations…</li>
<li>Hit the “+” icon and select “Remote”
<ul>
<li>Give it a name like “Debug Battlecode”</li>
<li>In “Settings”:
<ul>
<li>Set Host to <code>localhost</code></li>
<li>Set Port to <code>5005</code></li>
</ul></li>
<li>Hit OK</li>
</ul></li>
<li>In the top right corner of the screen, you should be able to select “Debug Battlecode” or equivalent from the little dropdown, and then hit the bug icon</li>
<li>If it works:
<ul>
<li>IntelliJ should highlight the line you put a breakpoint on and pause. You should see a “Debug” window at the bottom of the screen. Congratulations! You’re debugging.</li>
</ul></li>
<li>If it doesn’t work:
<ul>
<li>If the match just runs and nothing happens, then make sure that your breakpoint is in a place that will actually run during the match (e.g. at the top of <code>RobotPlayer::run</code>.)</li>
<li>If you get <code>Unable to open debugger port (localhost:5005): java.net.ConnectException "Connection refused"</code>, make sure you’ve actually started the server in <code>runDebug</code> mode, and that your port is set correctly. (You may also have to mess with your firewall settings, but try the other stuff first.)</li>
</ul></li>
</ul>
<h5 id="ignoring-battlecode-internals">Ignoring battlecode internals</h5>
<p>Sometimes you can step into battlecode internal stuff by accident. To avoid that: - Go into Settings or Preferences &gt; Build, Execution, Deployment &gt; Debugger &gt; Stepping - Select the “Skip class loaders” button - Select all the “Do not step into the classes…” options - Add the following packages by hitting the <code>+</code><sub>.*?</sub> - <code>battlecode.*</code> - <code>net.sf.*</code> - <code>gnu.trove.*</code> - <code>org.objectweb.*</code></p>
<h5 id="how-to-use-the-debugger">How to use the debugger</h5>
<p>When the debugger is paused, you should be able to see a “Debug” window. It has the following stuff in it:</p>
<ul>
<li>The “Frames” tab, which shows all the methods that have been called to get to where we are. (You can ignore the methods below “run”; they’re battlecode magic.)</li>
<li>The “Variables” tab, which shows the values of variables that are currently available.</li>
<li>A line of icons:
<ul>
<li>“Step over”, which goes to the next line in the current file, ignoring any methods you call.</li>
<li>“Step into”, which goes into whatever method you call next.</li>
<li>“Force step into”, which does the same thing as Step into, but also shows you inscrutable JVM internals while it goes. You shouldn’t need this.</li>
<li>“Step out”, which leaves the current method.</li>
<li>“Drop Frame”, which pretends to rewind, but doesn’t really. Don’t use this unless you know what you’re doing.</li>
<li>“Run to Cursor”, which runs until the code hits the line the cursor is on.</li>
<li>“Evaluate Expression”, which lets you put in any code you want and see what its value is.</li>
</ul></li>
<li>The “Threads” tab, which you shouldn’t mess with, because you might break the server.</li>
</ul>
<p>To learn more about these tools, see the <a href="https://www.jetbrains.com/help/idea/2016.3/debugger-basics.html">Intellij documentation</a>.</p>
<h5 id="conditional-breakpoints">Conditional breakpoints</h5>
<p>Sometimes, you might only want to pause if your robot is on team A, or the game is in round 537, or if you have fewer than a thousand bytecodes left. To make these changes, right click the breakpoint, and in the condition field, put the condition; you can use any variables in the surrounding code. If I have the method:</p>
<pre><code>import battlecode.common.Clock;
import battlecode.common.RobotController;

class RobotPlayer {'{'}
    // ...
    public static void sayHi(RobotController rc) {'{'}
        rc.broadcast(rc.getID(), rc.getType().ordinal());
    {'}'}
{'}'}</code></pre>
<p>I could make the following breakpoint conditions: - <code>rc.getTeam() == Team.A</code> - <code>rc.getRoundNum() == 537</code> - <code>Clock.getBytecodesLeft() &lt; 1000</code> - <code>rc.getTeam() == Team.A &amp;&amp; rc.getRoundNum() == 537 &amp;&amp; Clock.getBytecodesLeft() &lt; 1000</code></p>
</div>
          )


      } else if (this.state.ide === 'eclipse') {
          return (
              <div>
<h4 id="debugging-in-eclipse">Debugging in Eclipse</h4>
<h5 id="initial-setup-1">Initial setup</h5>
<ul>
<li>Go into Eclipse</li>
<li>Set a breakpoint in your code by clicking on the margin to the left of it so that a blue bubble appears</li>
<li>Go to Run &gt; Debug configurations</li>
<li>Select “Remote Java Application”</li>
<li>Hit the “new” button</li>
<li>Set up the debug configuration:
<ul>
<li>Give it a name (i.e. Debug Battlecode Bot)</li>
<li>Hit Browse, and select your project</li>
<li>Make sure connection type is “Standard”</li>
<li>Set Host to <code>localhost</code></li>
<li>Set Port to <code>5005</code></li>
<li>If there’s an error about selecting preferred launcher type at the bottom of the dialog, pick one; scala if you have scala code, java otherwise; although they should both work.</li>
</ul></li>
<li>Hit “Apply”</li>
<li>Hit “Debug”
<ul>
<li>If it works:
<ul>
<li>Eclipse should ask to open the “Debug” view; let it.</li>
<li>You should see new and exciting windows, and eclipse should pause and highlight a line of your code.</li>
<li>Congratulations; you’re debugging.</li>
</ul></li>
<li>If it doesn’t:
<ul>
<li>You may get a “failed to connect to VM; connection refused.” Make sure you’ve <a href="#starting-the-server-in-debug-mode">started the server in debug mode</a>.</li>
</ul></li>
</ul></li>
<li>You can also start debugging by selecting the little triangle next to the beetle in the toolbar and selecting “Debug Battlecode Bot”.</li>
</ul>
<h5 id="ignoring-battlecode-internals-1">Ignoring battlecode internals</h5>
<p>Oftentimes while debugging you can often step into classes you don’t care about - battlecode internal classes, or java classes. To avoid this, right click a stack frame in the “Debug” window - i.e. the thing beneath a Thread labeled <code>RobotPlayer.run</code> or whatever - and: - Select “Use Step Filters” - Select “Edit Step Filters”. - Select all the predefined ones - Add filter… - <code>battlecode.*</code> - <code>net.sf.*</code> - <code>gnu.trove.*</code> - <code>org.objectweb.*</code> - Hit “Ok”</p>
<p>And you should be good to go!</p>
<h5 id="using-the-debugger.">Using the debugger.</h5>
<p>See the <a href="http://help.eclipse.org/neon/index.jsp?topic=%2Forg.eclipse.jdt.doc.user%2Freference%2Fviews%2Fdebug%2Fref-debug_view.htm">eclipse documentation</a>.</p>
<h5 id="conditional-breakpoints-1">Conditional Breakpoints</h5>
<p>Sometimes, you might only want to pause if your robot is on team A, or the game is in round 537, or if you have fewer than a thousand bytecodes left. To make these changes: - Right click the breakpoint - Go to “Breakpoint Properties” - Check “Conditional” - Write a condition in the text box</p>
<p>If I have the method:</p>
<pre><code>import battlecode.common.Clock;
import battlecode.common.RobotController

class RobotPlayer {'{'}
    // ...
    public static void sayHi(RobotController rc) {'{'}
        rc.broadcast(rc.getID(), rc.getType().ordinal());
    {'}'}
{'}'}</code></pre>
<p>I could make the following conditions: - <code>rc.getTeam() == Team.A</code> - <code>rc.getRoundNum() == 537</code> - <code>Clock.getBytecodesLeft() &lt; 1000</code> - <code>rc.getTeam() == Team.A &amp;&amp; rc.getRoundNum() == 537 &amp;&amp; Clock.getBytecodesLeft() &lt; 1000</code></p>
</div>
          )
      }
  }



    render() {
        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Debugging</h4>
                                </div>
                                <div className="content">
<p>Using a “debugger” lets you pause your code while its running and inspect its state - what your variables are set to, what methods you’re calling, and so on. You can walk through your code step-by-step, and run arbitrary commands.</p>
<p>Battlecode supports “remote debugging”, which means that you start up the battlecode server and tell it to pause, then connect to it with Eclipse or Intellij. It’s easy to set up.</p>
<p>Following this guide, you'll be able to view the game in the client as you are debugging. Just keep the client open and the game should automatically play (up until your breakpoint).</p>
<h5 id="debugging-vocabulary">Debugging vocabulary</h5>
<p>Debugging has some new words that you might not know:</p>
<p>A <strong>debugger</strong> is a tool that runs your code and pauses when you tell it to. You’ll be using Eclipse or Intellij as a debugger for battlecode (unless you’re particularly hardcore.)</p>
<p>A <strong>breakpoint</strong> is an automatic pause point in the code. When the debugger gets to that line of code, it will pause, and wait for you to tell it what to do.</p>
<p><strong>Stepping</strong> is telling the debugger to take a single “step” in the code, and then pause again.</p>
<p>You can also <strong>resume</strong> code, to keep running until you hit another breakpoint.</p>
<p>The <strong>stack</strong> and <strong>stack frames</strong> are fancy words for, basically, the list of methods that are currently being called. So, if you have the methods:</p>
<pre><code>void doSomething() {'{'}
    goSomewhere();
{'}'}

void goSomewhere() {'{'}
    goLeft();
{'}'}

void goLeft() {'{'}
    rc.move(LEFT);
{'}'}</code></pre>
<p>And you call <code>doSomething()</code>, the stack will look like:</p>
<pre><code>   ...
    ^
rc.move(LEFT)
    ^
goLeft()
    ^
goSomewhere()
    ^
doSomething() </code></pre>
<p>If you have questions, ask in IRC.</p>
<h5 id="starting-the-server-in-debug-mode">Starting the server in debug mode</h5>
<p>Do <code>./gradlew runDebug -PteamA=examplefuncsplayer -PteamB=examplefuncsplayer -Pmaps=FourLakeLand</code> in a terminal. (Or equivalent, for the teams and maps you want.) (This works exactly like <code>./gradlew run</code>.) 
If you're in IntelliJ, you can just run the <code>runDebug</code> Gradle task there.
</p>
<p>It should say <code>Listening for transport dt_socket at address: 5005</code> and pause.</p>
<p>This means that the server has started, and is waiting for the Eclipse or IntelliJ debugger to connect.</p>
<p>(You have to do this every time you want to debug.)</p>

<p>
    Choose your IDE:
<div class="btn-group" role="group" style={{marginLeft: '10px'}}>
  <button type="button" class={this.getSelectionButtons('intellij')} onClick={this.intellijButton}>IntelliJ IDEA</button>
  <button type="button" class={this.getSelectionButtons('eclipse')} onClick={this.eclipseButton}>Eclipse</button>
</div>
</p>
    {this.getIDEInstallation()}




                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Second Method: Debugging with IntelliJ</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        This method probably does not allow you to view the game in the client at the same time. We recommend following the instructions above.
                                    </p>
                                <p>
                                    Add the gradle run task as a configuration
                                    <ul>
                                        <li>In the dropdown near the hammer, play, and bug icons, select <code>edit configurations</code></li>
                                        <li>Hit the plus and select <code>gradle</code></li>
                                        <li>Give the configuration a name, e.g. "RunBattlecode"</li>
                                        <li>Next to the <code>gradle project</code> field, click the folder icon and select <code>battlecode20-scaffold</code></li>
                                        <li>In the <code>Tasks</code> field, type <code>run</code></li>
                                        <li>Click <code>Apply</code>, <code>Ok</code></li>
                                    </ul>
                                    When your configuration is selected from the dropdown menu, clicking play will run the game, the same way double clicking run in the gradle window does.
                                    
                                    Clicking on the bug icon next to the play button will run the game in debug mode in the ide. Use breakpoints and the debuging interface to walk through your code.
                                    For more info on debugging with intelliJ, see <a href='https://www.jetbrains.com/help/idea/debugging-code.html'>here</a>


                                    You can specify the map and teams to run in the <code>gradle.properties</code> file.
                                </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Debugging;
