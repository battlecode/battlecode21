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

class GettingStarted extends Component {
    render() {
        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Getting Started</h4>
                                </div>
                                <div className="content">
                                    <br/>
                                <p>
                                    The Battlecode 2020 game will be released on January 6, 2020! Stay tuned for further details.
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
                                    This year's game is about soup. When the game is released, you will be able to read the <a href='battlecode20-game-specs'>full game specifications here</a>.
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
                                    Create an account on this website, and then go to the <NavLink to='team'>team</NavLink> section to either create
                                    or join a team.
                                </p>

                                <h4>
                                    Installation
                                </h4>
                                <p>
                                    Once the 2020 game is released, we will have detailed installation instructions here! In the meantime, you can install Java 8, which will be the official language of Battlecode 2020.
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
