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
                                    This is the Battlehack 2020 contest website, which will be your main hub for all Battlehack-related things
                                    for the duration of the contest. For a general overview of what Battlehack / Battlecode is, visit <a href='https://battlecode.org'>
                                        our landing page</a>.

                                </p>
                                <p>
                                   In this year's Battlehack game, you are one of the noble houses, manipulating your pawns around Westeros. You will write bots in Python.
                                </p>
                                <p>
                                    Battlehack 2020 is released! Read the <a href="specs.html">game specifications</a>. 
                                </p>
                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Account and Team Creation</h4>
                                </div>
                                <div className="content">
                                <p>
                                    To participate in Battlehack, you need an account and a team. Each team can consist of 1 to 2 people.
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
                                    <h6 class="installation-steps">Step 1: Install pip</h6>
                                <p>
                                You'll need to install pip - usually, it is already installed if you have Python installed. If, however, running <code>pip</code> or <code>pip3</code> produces an error, follow the installation instructions for pip &nbsp; <b><a href="https://pip.pypa.io/en/stable/installing/" style={{fontWeight:700}}>here</a></b>.

                                </p>
                                <p>
</p>

<h6 class="installation-steps">Step 2: Install packages</h6>
    <p>
        Next, run <code>pip install --user battlehack20</code> (or <code>pip3 install --user battlehack20</code>, depending on how your pip is set up). 
        This will get you set up with the necessary Python packages for proper engine function.
        </p>
        
<h6 class='installation-steps'>Step 3: Download Battlehack</h6>
<p>

    Next, you should get the starter code by downloading the <a href="https://github.com/battlecode/battlehack20-scaffold">Battlehack 2020 scaffold</a>.

    To get up and running quickly, you can click "Clone or download" and then "Download ZIP," and move on to the next step.

    You can also do fork the repo and do <code>git clone</code> if you know how to do that.
</p>
    
                                    <h6 class="installation-steps">Step 4: Hack!</h6>
    <p>
        We recommend using an IDE like Pycharm or an editor like VS Code to work on Battlecode, but you can also use your favorite text editor combined with a terminal.
        </p>
                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Run a Match</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        To run a match, use the command <code>python3 run.py path/to/bot1_folder path/to/bot2_folder</code>. You should see a game between the two specified bots being played out.
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
                                    Your bot will automatically be run against other players to determine your ranking. You can also request scrimmages with other teams, and see the replays.
                                </p>

                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Good Luck!</h4>
                                </div>
                                <div className="content">
                                <p>
                                    Now, read the <a href='specs.html'>game specs</a> carefully.
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
