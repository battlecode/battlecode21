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

class Resources extends Component {
    render() {
        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Game Specifications</h4>
                                </div>
                                <div className="content">
                                <p className='text-center'>
                                    <a type="button" className="btn btn-info btn-fill text-center" href='/specs.html'>Read the Game Specifications</a>
                                </p>
                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Visualizer</h4>
                                </div>
                                <div className="content">
                                <p className='text-center' style={{
                                    marginBottom: 20
                                }}>
                                    <a type="button" className="btn btn-info btn-fill text-center" href='/visualizer.html'>Go to the Visualizer</a>
                                </p>
                                <p>
                                    It is recommmended to run the client locally (see <NavLink to='getting-started'>getting started</NavLink>).
                                </p>


                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Lectures</h4>
                                </div>
                                <div className="content">
                                <p>
                                    Battlehack 2020 will not be holding official lectures. However, if you are experiencing issues with anything, join the Discord (see Getting Started)!
                                </p>


                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Other Resources</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        <p><b>
                                        Note: These resources were originally for Battlecode 2020, where Java was used. However, you may still find some tidbits about debugging/etc that might be useful.
                                        </b></p>
                                <ul>
                                    <li><a href='https://2020.battlecode.org/javadoc/index.html'>Javadocs</a>: the documentation of <code>RobotController</code> methods. Very helpful.</li>
                                    <li><NavLink to='common-issues'>Common Issues</NavLink>: a non-exhaustive collection of common problems, and fixes.</li>
                                    <li><NavLink to='debugging'>Debugging</NavLink>: a guide for how to debug your code.</li>
                                </ul>
                                </p>
                                <p>
                                    All of the code powering Battlecode 2020 is open source on GitHub, in the <a href='https://github.com/battlecode/battlecode20'>battlecode20 repository</a>.
                                </p>
                                <p>
                                    Third-party tools:
                                </p>
                                <p>
                                <ul>
                                    <li><a href='https://github.com/StoneT2000/BC20-MapBuilder'>Map builder</a>, by StoneT2000.</li>
                                    <li>Profiler (integrated into the official client), by jmerle.</li>
                                </ul>
                                </p>

                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Inspirational Quotes</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        <ul>
                                            <li>"don't die" — arvid.</li>

                                            <li>"stay alive" - ivy</li>

                                            <li>"smh my head" — marco</li>

                                            <li>"read the readme" — Quinn.</li>

                                            <li>"follow your dreams"</li>

                                            <li>"All successful people started with nothing more than a goal." - ezou.</li>

                                            <li>"Never give up" — Diuven.</li>

                                            <li>"we should get campbell's as a sponsor this year" - stephanie.</li>

                                            <li>"keep trying"</li>

					                        <li>"The best way to realize your dreams is to wake up." -jett.</li>

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

export default Resources;
