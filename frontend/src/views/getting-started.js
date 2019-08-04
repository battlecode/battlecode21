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

class GettingStarted extends Component {
    render() {
        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="card">
                                <div className="header">
                                    <h3 className="title">Getting Started</h3>
                                </div>
                                <div className="content">
                                    <br/>
                                <p>
                                All of the world's turtles are dying, and it is up you to save them!
                                Follow this short guide to get started with Battlecode 2020.
                                </p>

                                <h4>
                                    Overview
                                </h4>
                                <p>
                                    This is the Battlecode 2020 contest website, which will be your main hub for all Battlecode-related things
                                    for the duration of the contest. For a general overview of what Battlecode is, visit <a href='https://battlecode.org'>
                                        our landing page</a>.

                                </p>
                                <p>
                                    This year's game is about turtles. You can read the <a href='battlecode20-game-specs'>full game specifications here</a>.
                                    Before you start developing your bot, it is highly recommended to read the full game specifications carefully.
                                    To simply get up and running, however, it is sufficient to skim the document.
                                </p>

                                <h4>
                                    Account and Team Creation
                                </h4>
                                <p>
                                    To participate in Battlecode, you need an account and a team. Each team can consist of 1 to 4 people.
                                </p>
                                <p>
                                    Create an account on this website, and then go to the <a href='team'>team</a> section to either create
                                    or join a team.
                                </p>

                                <h4>
                                    Installation
                                </h4>
                                <p>
                                    In Battlecode 2020, you will write the code for your bots on your local computer, and to be able to
                                    run and view games, you need to install the developer tools.
                                </p>

                                <h4>
                                    Your First Bot and Scrimmage
                                </h4>
                                <p>
                                    Follow these steps to run your first game using a sample bot, and upload it, and then scrimmage Teh Devs.
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
