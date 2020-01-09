import React, { Component } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

const He = styled.h5`
  font-weight: bold;
  font-size:1.3em;
`;

const Hee = styled.h5`
  text-decoration:underline;
  font-size:1.2em;
`;

class Issues extends Component {
    render() {
        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Installation Issues</h4>
                                </div>
                                <div className="content">
                                <p>
                                    Known errors, with solutions:
                                    <ul>
                                        <li><code>Exception in thread "examplefuncsplayer.RobotPlayer #0" java.lang.IllegalArgumentException</code>. This means that Gradle
                                        is not finding a Java 8 JDK. This could be if you installed a newer version of Java, or if you already had a newer version of Java
                                        installed from earlier. We will add instructions here shortly, but for now, ask on the Discord for the fix.
                                        <ul>
                                            <li>For Windows, try following <a href="https://www.theserverside.com/feature/How-to-set-JAVA_HOME-in-Windows-and-echo-the-result">these instructions</a>.</li>
                                            <li>Try setting <code>org.gradle.java.home=/path_to_jdk_1.8_directory</code>. You need to know your <code>JAVA_HOME</code> (try <a href='https://www.baeldung.com/find-java-home'>this guide</a>).</li>
                                        </ul>
                                        </li>
                                        <li><code>Exception in thread "WebsocketSelector14" java.lang.NullPointerException</code>. A common error in java, but sometimes happens if you close the client while a game is running.
                                        The solution is to run <code>./gradlew --stop</code> to stop all of the Gradle daemons and the next time you open the client it will use a fresh one.</li>
                                        <li><code>Exception in thread "WebsocketSelector14" java.lang.NullPointerException at battlecode.server.NetServer.onError(NetServer.java:165)</code>. This
                                        probably means that you're running two instances of the engine at the same time. Try running <code>./gradlew --stop</code> (if you're running
                                        things in IntelliJ, click the elephant in the Gradle Tool Window (the right-hand sidebar) and then execute <code>gradle --stop</code> in the
                                        window that pops up). If that doesn't work, ask on the Discord.</li>
                                    </ul>
                                    If your error is not listed above, ask on <a href='https://discordapp.com/channels/386965718572466197/662426611563626537'>the Discord</a>.
                                </p>
                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Other Issues</h4>
                                </div>
                                <div className="content">
                                <p>
                                    <ul>
                                    <li><i>After an update, InteliiJ doesn't recognize new API functions (e.g. <code>rc.getMapWidth</code>).</i>  You 
                                    need to refresh dependencies. Right-click on the project name (most likely <code>battlecode20-scaffold</code>) in the Gradle Tool Window (the right-hand sidebar),
                                    and click <code>Refresh Gradle Dependencies</code>. It is good to do this after every update.</li>
                                    </ul>
                                </p>
                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Things to Try When Nothing Else Helps</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        (Note, Gradle tasks are written as <code>./gradlew taskname</code> here, but you can also run <code>taskname</code> in your IDE.)
                                    </p>
                                    <p>
                                        Always follow each of the below Gradle commands with <code>./gradlew build</code>.
                                    </p>
                                <p>
                                    <ul>
                                        <li>Did you download the Oracle JDK 8 listed in <NavLink to='getting-started'>the installation instructions</NavLink>?</li>
                                        <li>Did you set your <code>JAVA_HOME</code> correctly?</li>
                                        <li><code>./gradlew clean</code> (always good to try)</li>
                                        <li><code>./gradlew cleanEclipse</code> (if Eclipse)</li>
                                        <li><code>Refresh Gradle Dependencies</code> in IntelliJ (see above)</li>
                                        <li><code>./gradlew --stop</code> (stops Gradle daemons)</li>
                                        <li><code>rm -r ~/.gradle</code> (removes the Gradle cache)</li>
                                        <li>Redownload <a href="https://github.com/battlecode/battlecode20-scaffold">the scaffold</a>.</li>
                                    </ul>
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

export default Issues;
