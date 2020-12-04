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
                                    <a type="button" className="btn btn-info btn-fill text-center" href='/specs.html'>Read the (OLD) Battlecode 2020 Game Specifications</a>
                                </p>
                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Third-party Tools</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        The tools below were made by contestants! They haven't been tested by the devs, but might prove to be
                                        very helpful in developing your bot.
                                    </p>
                                    <p>
                                        If you make a new tool that could be useful to others, please post it in the <a href='https://discordapp.com/channels/386965718572466197/531960965240193024'>#open-source-tools channel</a> on the Discord.
                                        Everyone will love you!!
                                    </p>
                                    <ul>
                                        <li><code>battlehack2020-viewer</code>: A viewer for replay files, in your browser! Useful for watching your scrimmages. Made by rzhan11 of <NavLink to='rankings/1624'>team Kryptonite</NavLink>, and
                                                with <a href="https://github.com/rzhan11/battlehack2020-viewer">installation instructions on Github</a>.</li>
                                        <li><code>battlehack20-fancyviewer</code>: Another viewer, written in Python! Like the command line viewer,
                                        this viewer automatically shows the game when you run the match, but it also supports viewing a replay file. Made by cooljoseph of <NavLink to='rankings/1628'>team D5</NavLink>.
                                        Discord has <a href='https://discordapp.com/channels/386965718572466197/531960965240193024/700738991577890927'>installation instructions</a>,
                                        and the <a href='https://github.com/cooljoseph1/battlehack20-fancyviewer'>source code is on GitHub</a></li>
                                        <li><code>viewer.py</code>: A third viewer! Lightweight, in Python. Made by Houwang of <NavLink to='rankings/1685'>team IDIOT</NavLink>, and you can <a href='/houwang_viewer.py'>download the Python file here</a>.</li>
                                        <li><code>battlehack20-minimal</code>: A minimal version of the engine, promising speedups of up to 30x! 
                                        Made by cooljoseph of <NavLink to='rankings/1628'>team D5</NavLink>, with <a href='https://github.com/cooljoseph1/battlehack20-minimal#installation-and-usage'>installation instructions on GitHub</a>. <b>Important</b>: Note that
                                        using this engine might mean that the code you run locally doesn't behave in exactly the same way as the same code run on our
                                        servers — in particular, this engine does not impose any bytecode limits, which you might run into on the server — and this could
                                        cause unexpected errors and make debugging harder.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Lectures</h4>
                                </div>
                                <div className="content">
                                <p>
                                    Battlecode 2021 will be holding lectures, where a dev will be going over possible strategy, coding up an example player, answering questions, etc.
                                    Lectures are streamed on Twitch every weekday the first two weeks of IAP 7-10 PM Eastern Time.
                                </p>
                                <p>
                                    All lectures are streamed live on <a href='https://twitch.tv/mitbattlecode'>our Twitch account</a>, and
                                    are later uploaded to <a href='https://youtube.com/channel/UCOrfTSnyimIXfYzI8j_-CTQ'>our YouTube channel</a>.
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
