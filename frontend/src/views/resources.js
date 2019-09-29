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
                                    <a type="button" className="btn btn-info btn-fill text-center" href='/battlecode20-game-specs.html'>Read the Game Specifications</a>
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
                                    You can also run the visualizer locally, which, for example, has the added benefit of automatically reloading replay files.
                                    Go to the GitHub.
                                </p>


                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Lectures</h4>
                                </div>
                                <div className="content">
                                <p>
                                    Lectures are held at MIT in 26-100 between 7 and 9 pm every weekday the first two weeks of IAP.
                                </p>
                                <p>
                                    All lectures are streamed live on <a href='https://twitch.tv/mitbattlecode'>our Twitch account</a>, and
                                    are later uploaded to <a href='https://youtube.com/channel/UCOrfTSnyimIXfYzI8j_-CTQ'>our YouTube channel</a>.
                                </p>


                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Other Resources</h4>
                                </div>
                                <div className="content">
                                <p>
                                    Starter pack.
                                </p>
                                <p>
                                    All of the code powering Battlecode 2020 is open source on GitHub, in the <a href='https://github.com/battlecode/battlecode20'>battlecode20 repository</a>.
                                </p>
                                <p>
                                    Third-party tools.
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

                                            <li>"donut give up; bee-leaf in yourself!" — darren.</li>

                                            <li>"follow your dreams"</li>

                                            <li>"All successful people started with nothing more than a goal." - ezou.</li>

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
