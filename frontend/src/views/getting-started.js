import React, { Component } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import Floater from 'react-floater';



const He = styled.h5`
  font-weight: bold;
  font-size:1.3em;
`;

const Hee = styled.h5`
  text-decoration:underline;
  font-size:1.2em;
`;

class GettingStarted extends Component {
  constructor() {
    super();

    this.state = {
        ide: "intellij"
    }

  }

  terminalButton = () => {
      this.setState({ide: "terminal"})
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
                  <ul style={{marginLeft: '-15px'}}>
        <li>Install IntelliJ IDEA Community Edition <a href='https://www.jetbrains.com/idea/download/'>from here</a>.</li>

        <li>In the <code>Welcome to IntelliJ IDEA</code> window that pops up when you start IntelliJ, select <code>Import Project</code></li>
        
        <li>In the <code>Select File or Dictionary to Import</code> window, select the <code>build.gradle</code> file in the scaffold folder.</li>
        
        <li>Hit OK.</li>
        
        <li>We need to set the jdk properly; open the settings with <code>File > Settings</code> (<code>IntelliJ IDEA > Preferences</code> on Mac) or <code>ctrl+alt+s</code>. Navigate to <code>Build, Execution, Deployment > Build Tools > Gradle</code> and change <code>Gradle JVM</code> to 1.8</li>
        
        <li>Time for a first build! On the right side of the screen, click the small button that says gradle and has a picture of an elephant. Navigate to <code>battlecode20-scaffold > Tasks > battlecode</code> and double click on <code>build</code>. This will install the client and engine for you.</li>

        <li>If you haven't seen any errors, you should be good to go.</li>
        </ul>
        </div>)
      } else if (this.state.ide === 'eclipse') {
          return (
              <div>
                  <ul style={{marginLeft: '-15px'}}>
<li>Download the latest version of Eclipse <a href='https://www.eclipse.org/downloads/'>from here</a>.</li>

<li>In the Installer, select <code>Eclipse IDE for Java Developers</code>.</li>

<li>Create a new Eclipse workspace. The workspace should NOT contain the <code>battlecode20-scaffold</code> folder.</li>

<li>Run <code>File -> Import...</code>, and select <code>Gradle / Existing Gradle Project</code>.
            <Floater content={
                                    <div>
                                    <p>
If you are unable to find this option, you may be using an old version of Eclipse. If updating your Eclipse version still does not work, you may need to manually install the "Buildship" plugin from the Eclipse marketplace.
</p></div>
} showCloseButton={true}>
                                    <i className="pe-7s-info pe-fw" />
</Floater>
</li>

<li>Next to <code>Project root directory</code> field, press <code>Browse...</code> and navigate to <code>battlecode20-scaffold</code>. Finish importing the project.</li>

<li>If you do not see a window labeled <code>Gradle Tasks</code>, navigate to <code>Window / Show View / Other...</code>. Select <code>Gradle / Gradle Tasks</code>.</li>

<li>In the <code>Gradle Tasks</code> window, you should now see a list of available Gradle tasks. Open the <code>battlecode20-scaffold</code> folder and navigate to the <code>battlecode</code> group, and then double-click <code>build</code>. This will run tests to verify that everything is working correctly</li>

<li>You're good to go; you can run other Gradle tasks using the other options in the <code>Gradle Tasks</code> menu. Note that you shouldn't need any task not in the <code>battlecode</code> group.
            <Floater content={
                                    <div>
                                    <p>
                                    If you rename or add jar files to the lib directory, Eclipse gets confused. You'll need to re-add them using <code>Project / Properties / Java Build Path</code>.
</p></div>
} showCloseButton={true}>
                                    <i className="pe-7s-info pe-fw" />
</Floater>
</li>
                  </ul>
              </div>
          )
      } else if (this.state.ide === 'terminal') {
          return (
              <div>
                  <ul style={{marginLeft: '-15px'}}>
<li>Start every Gradle command with <code>./gradlew</code>, if using Mac or Linux, or <code>gradlew</code>, if using Windows.</li>

<li>You will need to set the <code>JAVA_HOME</code> environment variable to point to the installation path of your JDK.
            <Floater content={
                                    <div>
                                    <p>
                                    On Mac, <code>JAVA_HOME</code> should probably be something like <code>/Library/Java/JavaVirtualMachines/jdk1.8.0_111.jdk/Contents/Home</code>.
</p></div>
} showCloseButton={true}>
                                    <i className="pe-7s-info pe-fw" />
</Floater>
</li>

<li>Navigate to the root directory of your <code>battlecode20-scaffold</code>, and run <code>./gradlew build</code> (or <code>gradlew build</code> on Windows). This will run tests, to verify that everything is working.</li>

<li>You're good to go. Run <code>./gradlew -q tasks</code> (<code>gradlew -q tasks</code> on Windows) to see the other Gradle build tasks available. You shouldn't need to use any tasks outside of the <code>battlecode</code> group.</li>
                  </ul>
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
                                    <h4 className="title">Overview</h4>
                                </div>
                                <div className="content">

                                <p>
                                    This is the Battlecode 2020 contest website, which will be your main hub for all Battlecode-related things
                                    for the duration of the contest. For a general overview of what Battlecode is, visit <a href='https://battlecode.org'>
                                        our landing page</a>.

                                </p>
                                <p>
                                    This year's game is a thrilling survival adventure involving 🍲, ▀⛓, 🐮, 🤖, and more. You will write bots in Java.
                                </p>
                                <p>
                                    The Battlecode 2020 game will be released on January 6, 2020! Stay tuned for further details.
                                </p>
                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Account and Team Creation</h4>
                                </div>
                                <div className="content">
                                <p>
                                    To participate in Battlecode, you need an account and a team. Each team can consist of 1 to 4 people.
                                </p>
                                <p>
                                    Create an account on this website, and then go to the <NavLink to='team'>team</NavLink> section to either create
                                    or join a team.
                                </p>
                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Installation</h4>
                                </div>
                                <div className="content">
                                <p>
                                    If you experience problems with the instructions below, check <NavLink to='common-issues'>common issues</NavLink>, and if that doesn't help, ask on the Discord.
                                </p>
                                    <h6 class="installation-steps">Step 1: Install Java</h6>
                                <p>
                                You'll need a Java Development Kit (JDK) version 8. Unfortunately, higher versions will not
                                work. <b><a href="http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html" style={{fontWeight:700}}>Download it here</a></b>.
                                You may need to create an Oracle account.

                                <Floater content={
                                    <div>
                                    <p>
Alternatively, you can install a JDK yourself using your favorite package manager. Make sure it's an Oracle JDK — we don't support anything else — and is compatible with Java 8.
</p></div>
} showCloseButton={true}>
                                    <i className="pe-7s-info pe-fw" />
</Floater>
                                </p>
                                <p>
</p><p>
If you're unsure how to install the JDK, you can find instructions for all operating systems <a href='https://docs.oracle.com/javase/8/docs/technotes/guides/install/install_overview.html'>here</a> (pay attention to <code>PATH</code> and <code>CLASSPATH</code>).
</p>
<h6 class='installation-steps'>Step 2: Download Battlecode</h6>
<p>

    Next, you should download the <a href="https://github.com/battlecode/battlecode20-scaffold">Battlecode 2020 scaffold</a>.

    To get up and running quickly, you can click "Clone or download" and then "Download ZIP," and move on to the next step.

    </p><p>
    We recommend, however, that you instead use Git to organize your code. If you haven't used Git before, read <a href='https://guides.github.com/introduction/git-handbook/'>this guide</a> (or
    wait for our lecture covering it). On the <a href="https://github.com/battlecode/battlecode20-scaffold">scaffold page</a>, click "Use this template." Importantly, on the next page, make your new repo <b>private</b> (you don't want other teams to steal your code!). You can then clone your newly created repo and invite your team members to collaborate on it.
    </p>
    
                                    <h6 class="installation-steps">Step 3: Local Setup</h6>
    <p>
        We recommend using an IDE like IntelliJ IDEA or Eclipse to work on Battlecode, but you can also use your favorite text editor combined with a terminal.
        Battlecode 2020 uses Gradle to run tasks like <code>run</code>, <code>debug</code> and <code>jarForUpload</code> (but don't worry about that — you don't need to install it).
        </p><p>
View instructions for: 

<div class="btn-group" role="group" style={{marginLeft: '10px'}}>
  <button type="button" class={this.getSelectionButtons('intellij')} onClick={this.intellijButton}>IntelliJ IDEA</button>
  <button type="button" class={this.getSelectionButtons('eclipse')} onClick={this.eclipseButton}>Eclipse</button>
  <button type="button" class={this.getSelectionButtons('terminal')} onClick = {this.terminalButton}>Terminal</button>
</div>
</p>
<p>
    {this.getIDEInstallation()}

</p>
<p>There should now be a folder called <code>client</code> in your scaffold folder; if you go in there, and double click the <code>Battlecode Client</code> application, you should be able to run and watch matches. (Please don't move that application, it will be sad.) 
If you're on Linux, navigate to the <code>client</code> folder and run <code>./battlecode-visualizer</code> to launch the client.</p>

                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Run a Match</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        Player code is in the <code>src</code> directory of the scaffold: each package inside <code>src</code> corresponds to one distinct player.
                                        We have provided <code>examplefuncsplayer</code>, and you can create your own player by either modifying it or copying and renaming it.
                                <Floater content={
                                    <div>
                                    <p>
                                        The only restriction is that each player must have a file named <code>RobotPlayer.java</code> which implements a <code>run(RobotController rc)</code> method.
</p></div>
} showCloseButton={true}>
                                    <i className="pe-7s-info pe-fw" />
</Floater>
                                    </p>
                                <p>
                                    You should have a client application in the <code>client</code> folder. Launch it, and go to the <code>Runner</code> section. 
                                    There, you can specify which players to run against each other, and on which map, and you can view the match as it is running.
                                </p>
                                <p>
                                    You can also run a match without the client, by invoking the Gradle task <code>run</code>. 
                                    For example, <code>gradle run -PteamA=examplefuncsplayer -PteamB=examplefuncsplayer -Pmaps=FourLakeLand</code> runs <code>examplefuncsplayer</code> against itself on the <code>FourLakeLand</code> map. This produces a replay file in the <code>matches</code> directory of the scaffold, which you can upload to the client to view.
                                </p>


                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Upload Your Bot and Scrimmage</h4>
                                </div>
                                <div className="content">
                                <p>
                                    Create a zip file containing only your robot code (only 1 package), and uploaded it to the <NavLink to='submissions'>submissions</NavLink> page.
                                </p>
                                <p>
                                    Your bot will automatically be ran against other players to determine your ranking. You can also request scrimmages with other teams, and see the replays.
                                </p>

                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Good Luck!</h4>
                                </div>
                                <div className="content">
                                <p>
                                    Now, read the <a href='specs.html'>game specs</a> carefully and consult the <a href='javadoc/index.html'>javadocs</a> to learn about the API.
                                </p>
                                <p>
                                    Bugs will happen eventually; read about our <NavLink to='debugging'>debugging tools here</NavLink>.
                                </p>
                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Join the Community!</h4>
                                </div>
                                <div className="content">
                                <p>
                                    Battlecode has a Discord server! 
                                    Everyone is encouraged to join. 
                                    Announcements, strategy discussions, bug fixes and ~memes~ all 
                                    happen on Discord. Follow this invite link to join: <a href='https://discord.gg/N86mxkH'>https://discord.gg/N86mxkH</a>.
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

export default GettingStarted;
