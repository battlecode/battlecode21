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
        
        <li>In the <code>Open File or Project</code> window, select the <code>build.gradle</code> file in the scaffold folder.</li>
        
        <li>Check the options "Create separate module per source set", and "Use gradle wrapper task configuration". Set the "Gradle JVM" option to 1.8. 
            <Floater content={
                                    <div>
                                    <p>
                                        If you don't have a 1.8 option, make sure you followed step 1 and installed Java correctly.
</p></div>
} showCloseButton={true}>
                                    <i className="pe-7s-info pe-fw" />
</Floater>
</li>
        
        <li>Hit OK.</li>
        
        <li>Wait a minute or two for IntelliJ to finish configuring itself.</li>
        
        <li>When the bar at the bottom of the screen has stopped downloading things, we'll need to check that everything is set up correctly. Go to <code>View / Tool Windows / Gradle</code>. In the new window that pops up, select <code>Tasks / battlecode / build</code>, and double click it. You should now see a nice tree of tasks unfold at the bottom of the screen. If you run into an error here, you should <a href='https://discordapp.com/channels/386965718572466197/662426611563626537'>get help on Discord</a>.</li>
        
        <li>If you haven't seen any errors, you should be good to go. </li>
        </ul>
        </div>)
      } else if (this.state.ide === 'eclipse') {
          return (
              <div>
                  <ul style={{marginLeft: '-15px'}}>
<li>Download the latest version of Eclipse <a href='https://www.eclipse.org/downloads/'>from here</a>.</li>

<li>In the Installer, select <code>Eclipse IDE for Java Developers</code>.</li>

<li>Create a new Eclipse workspace. The workspace should NOT contain the <code>battlecode20-scaffold</code> folder.</li>

<li>Run <code>File -> Import...</code>, and select <code>Gradle / Gradle Project</code>.
            <Floater content={
                                    <div>
                                    <p>
If you are unable to find this option, you may be using an old version of Eclipse. If updating your Eclipse version still does not work, you may need to manually install the "Buildship" plugin from the Eclipse marketplace.
</p></div>
} showCloseButton={true}>
                                    <i className="pe-7s-info pe-fw" />
</Floater>
</li>

<li>In the <code>Select root directory</code> field, navigate to <code>battlecode20-scaffold</code>. Finish importing the project.</li>

<li>Open <code>Window / Show View / Other...</code>. Select <code>Gradle / Gradle Tasks</code>.</li>

<li>You should now see a list of available Gradle tasks somewhere in the IDE. Open the <code>battlecode</code> group, and double-click <code>build</code>. This will run tests to verify that everything is working correctly</li>

<li>You're good to go; you can run other Gradle tasks using the other options in the "Gradle Tasks" menu. Note that you shouldn't need any task not in the <code>battlecode</code> group.
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
<li>Start every Gradle command with <code>./gradlew</code>, if using Max or Linux, or <code>gradlew</code>, if using Windows.</li>

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
                                The first lecture, on January 6, will walk you through these installation steps.
                                </p>
                                    <h6 class="installation-steps">Step 1: Install Java</h6>
                                <p>
                                You'll need a Java Development Kit (JDK) compatible with Java 8 or later, which you 
                                can <b><a href="http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html">install here</a></b>.
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
<p>There should now be a folder called <code>client</code> in your scaffold folder; if you go in there, and double click the <code>Battlecode Client</code> application, you should be able to run and watch matches. (Please don't move that application, it will be sad.)</p>

                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Run a Match</h4>
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
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Scrimmage</h4>
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
