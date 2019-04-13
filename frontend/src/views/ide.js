import React, { Component } from 'react';
import Api from '../api';

import bc19 from 'bhse19/runtime';
import Game from 'bhse19/game';
import Compiler from 'bhse19/compiler';

import Visualizer from './visualizer';
import Slider from 'rc-slider';


import * as Cookies from "js-cookie";

var firebase_config = {
    apiKey: "AIzaSyBT7Mu9Bw6UH0Tr-mKXMwhKjdnLppdjvA4",
    authDomain: "battlehack-se19.firebaseapp.com",
    databaseURL: "https://battlehack-se19.firebaseio.com",
    //projectId: "battlecode18",
    //storageBucket: "battlecode18.appspot.com",
    //messagingSenderId: "323934682061"
};

window.ace.require("ace/ext/language_tools");
window.firebase.initializeApp(firebase_config);


/*
Okay, so here's how the IDE game running works. It's not pretty.

When the user starts a game, an instance of the Game class is created
as this.g. We also create the runtime bc19 to run the game. Simultaneously,
we have a Visualizer instance running as this.v. It is fed the replay file
this.g.replay, which is continuously updated as the game progresses. To do the
visualizing process, this.v itself spawns a new Game instance, called
this.v.game. The reason for this is that we want to
be able to pause the visualizer while running the game (why, exactly?), and also
because that is how the visualizer needs to work for the standalone viewer.
*/

class IDE extends Component {
    constructor() {
        super();

        var t = Cookies.get('theme');
        var ci = Cookies.get('chess_init');
        var ce = Cookies.get('chess_extra');

        this.state = {
            menu:false,
            theater:false,
            logs:[[],[]],
            loading:true,
            error:false,
            errors:'',
            chess_init:(ci ? ci : 100),
            chess_extra:(ce ? ce : 30),
            lang:('javascript'),
            theme:(t ? t : 'light'),
            vimkeys:Cookies.get('vimkeys'),
            seed:Cookies.get('seed'),
            auto:Cookies.get('auto'),
            numTurns:0, // # loaded turns
            numRounds:0, // # loaded rounds
            turn:null, // # turn in viewer
            round:null // # round in viewer
        };

        this.storage = {};

        this.push = this.push.bind(this);
        this.run = this.run.bind(this);
        this.showMenu = this.showMenu.bind(this);
        this.changeHandler = this.changeHandler.bind(this);
        this.hideSidebar = this.hideSidebar.bind(this);
        this.exitTheater = this.exitTheater.bind(this);
        this.exitErrors = this.exitErrors.bind(this);
        this.changeSlider = this.changeSlider.bind(this);
        this.startStop = this.startStop.bind(this);
        this.startStopGame = this.startStopGame.bind(this);
    }


    startStop() {
        this.v.startStop();
    }
    startStopGame() {
        if (this.c.stopped) {
            this.c.unstop()
        } else {
            this.c.stop();
        }
    }



    componentDidMount() {
        this.editor = window.ace.edit("firepad-container");
        this.session = this.editor.getSession();
        this.session.setUseWorker(false);
        this.session.setMode("ace/mode/javascript");
        this.session.setUseSoftTabs(true);
        this.session.setTabSize(4);
        this.editor.setShowPrintMargin(false);

        Api.getUserTeam(function(t) {
            var hash = t.id + "|" + t.team_key;
            var ref = window.firebase.database().ref().child(hash);
            this.firepad = window.Firepad.fromACE(ref, this.editor);
            this.firepad.on('ready', function() {
                this.setState({loading:false});
            }.bind(this));
        }.bind(this));

        this.editor.commands.addCommand({
            name: 'run',
            bindKey: {win: 'Ctrl-B',  mac: 'Command-B'},
            exec: this.run,
            readOnly: true
        }); this.componentDidUpdate();
    }

    push() {
        Compiler.Compile(this.state.lang, this.firepad.getText(), function(code) {
            console.log('push code')
            Api.pushTeamCode(code, function(has_no_error) {
                if (has_no_error) {
                    document.getElementById('submission-status').innerHTML = 'Submission successful!';
                }
            });
        }, function(errors) {
            this.setState({error: true, errors:errors});
        }.bind(this));
    }

    run() {
        this.setState({loading:true});

        Compiler.Compile(this.state.lang, this.firepad.getText(), function(code) {
            this.setState({theater:true, loading:false});
            var seed = (!this.state.seed || this.state.seed === '' || this.state.seed === 0) ? Math.floor(Math.pow(2,31)*Math.random()) : parseInt(this.state.seed,10);
            this.g = new Game(seed, parseInt(this.state.chess_init,10), parseInt(this.state.chess_extra,10), false, true);
            var viewerWidth = document.getElementById('viewer').offsetWidth;
            var viewerHeight = document.getElementById('viewer').offsetHeight;
            this.v = new Visualizer('viewer', this.g.replay, function(turn) {
                if (turn !== this.v.turn) {
                    console.log("UNBELIEVABLE. IDE.JS");
                }
                if (turn !== this.v.game.turn) {
                    console.log("UNBELIEVABLE VERSION 2. IDE.JS");
                }
                this.setState({turn:turn,round:this.v.game.round});
            }.bind(this), Math.min(viewerWidth, viewerHeight), Math.min(viewerWidth, viewerHeight));
            this.c = new bc19(this.g, null, function(logs) {}, function(logs) {
                // log receiver
                if (this.v.numTurns() !== this.g.turn) {
                    console.log('SOMETHING IS VERY WRONG IN IDE.JS');
                }
                this.setState({logs:logs,numTurns:this.v.numTurns(),numRounds:this.g.round,turn:this.v.turn, round:this.v.game.round});
                this.v.populateCheckpoints();

            }.bind(this));

            this.c.playGame(code, code);
        }.bind(this), function(errors) {
            this.setState({loading:false, error: true, errors:errors});
        }.bind(this));
    }

    changeSlider(round) {
        if (this.v.running) this.v.startStop();
        this.v.goToRound(round);
        this.setState({round:round});
        // this.v.goToTurn(turn);
        // this.setState({turn:turn});
    }

    componentDidUpdate() {
        this.editor.resize();
        var element = document.getElementById("redConsole");
        element.scrollTop = element.scrollHeight;
        element = document.getElementById("blueConsole");
        element.scrollTop = element.scrollHeight;

        this.session.setMode("ace/mode/" + this.state.lang);
        this.editor.setTheme("ace/theme/" + this.state.theme);
        this.editor.setOptions({
            enableBasicAutocompletion: this.state.auto==='true',
            enableSnippets: this.state.auto==='true',
            enableLiveAutocompletion: this.state.auto==='true'
        }); this.editor.setKeyboardHandler(this.state.vimkeys);
    }

    exitTheater() {
        this.c.destroy();
        this.c = null;
        // NEED TO CHECK IF THESE THINGS ARE ACTUALLY DELETED BUT THAT'S OKAY
        this.v.destroyVis();
        this.v = null;
        this.g = null;
        this.setState({theater:false});
    }

    exitErrors() {
        this.setState({error:false, errors:''});
    }

    showMenu() {
        this.setState(function(prev,props) {
            prev.menu = !prev.menu;
            return prev;
        });
    }

    changeHandler(e) {
        var id = e.target.id;
        var val = e.target.value;

        Cookies.set(id, val);
        this.setState(function(prev, props) {
            prev[id] = val;
            return prev;
        });
    }

    hideSidebar() {
        this.setState({menu:false});
    }

    render() {
        return (
            <div className="content" style={{
                width:"100%",
                height:"calc(100% - 1000px)",
                padding:"0px",
                overflow:"hidden"
            }}>
                <div style={{
                    width:"100%",
                    height:"100%",
                    position:"absolute",
                    top:"0px",
                    opacity:(this.state.theater||this.state.error||this.state.loading)?"0.8":"0",
                    backgroundColor:"#000",
                    zIndex:"100",
                    visibility:(this.state.theater||this.state.error||this.state.loading)?"visible":"hidden",
                    transition:"opacity 500ms ease, visibility 500ms ease",
                }}></div>

                <div style={{
                    top:"calc(50% - 35px)",
                    left:"calc(50% - 35px)",
                    position:"absolute",
                    zIndex:"101",
                    visibility:this.state.loading?"visible":"hidden",
                    transition:"visibility 500ms ease",
                    width:"70px",
                    height:"70px"
                }} className='sk-circle'>
                    <div className="sk-circle1 sk-child"></div>
                    <div className="sk-circle2 sk-child"></div>
                    <div className="sk-circle3 sk-child"></div>
                    <div className="sk-circle4 sk-child"></div>
                    <div className="sk-circle5 sk-child"></div>
                    <div className="sk-circle6 sk-child"></div>
                    <div className="sk-circle7 sk-child"></div>
                    <div className="sk-circle8 sk-child"></div>
                    <div className="sk-circle9 sk-child"></div>
                    <div className="sk-circle10 sk-child"></div>
                    <div className="sk-circle11 sk-child"></div>
                    <div className="sk-circle12 sk-child"></div>
                </div>

                <div style={{
                    width:"calc(100% - 50px)",
                    height:"calc(100% - 50px)",
                    position:"absolute",
                    top:this.state.error?"25px":"-2000px",
                    right:"25px",
                    backgroundColor:"#fff",
                    zIndex:"101",
                    visibility:this.state.error?"visible":"hidden",
                    transition:"top 500ms ease, visibility 500ms ease",
                }}>
                    <i className="pe-7s-close-circle" style={{
                        position:"absolute",
                        top:"-15px",
                        right:"-15px",
                        fontSize:"1.5em",
                        cursor:"pointer",
                        border:"10px solid #fff",
                        backgroundColor:"#fff",
                        borderRadius:"20px"
                    }} onClick={ this.exitErrors }/>
                    <pre id="console" style={{
                        position:"absolute",
                        top:"30px",
                        left:"20px",
                        width:"calc(100% - 40px)",
                        height:"calc(100% - 50px)",
                        backgroundColor:"#333",
                        color:"#fff",
                        fontFamily:"Roboto Mono, monospace",
                        padding: "20px",
                        fontSize:"0.9em"
                    }}>
                    { this.state.errors }
                    </pre>
                </div>

                <div style={{
                    width:"calc(100% - 50px)",
                    height:"calc(100% - 50px)",
                    position:"absolute",
                    top:this.state.theater?"25px":"-2000px",
                    right:"25px",
                    backgroundColor:"#fff",
                    zIndex:"101",
                    visibility:this.state.theater?"visible":"hidden",
                    transition:"top 500ms ease, visibility 500ms ease",
                }}>
                    <i className="pe-7s-close-circle" style={{
                        position:"absolute",
                        top:"-15px",
                        right:"-15px",
                        fontSize:"1.5em",
                        cursor:"pointer",
                        border:"10px solid #fff",
                        backgroundColor:"#fff",
                        borderRadius:"20px"
                    }} onClick={ this.exitTheater }/>



                    <div id="viewer" style={{
                        position:"absolute",
                        top:"20px",
                        float:"left",
                        height:"60%",
                        width:"50%",
                        textAlign: "center"
                    }}></div>
                    <div id="viewer-ops" style={{
                        marginTop:"20px",
                        float:"right",
                        width:"50%",
                        height:"60%",
                        paddingLeft: "50px",
                        paddingRight:"50px",
                        display:(this.v == null)?'none':'block'
                    }}>
                        <h2>Round {this.state.round}/256</h2>
                        <Slider style={{
                            width:'100%',
                            marginBottom:'1em'
                        }} max={256} onChange={this.changeSlider} value={this.state.round} />
                        <button style={{
                            width:'100%'
                        }} onClick={this.startStop}>START/STOP VIEWER</button>
                        
                        <Slider style={{
                            width:'100%',
                            marginTop: '1em'
                        }} max={256} value={this.state.numRounds} />
                        <h6>Has loaded {this.state.numRounds} out of 256 rounds.</h6>
                        <button style={{
                            width:'100%'
                        }} onClick={this.startStopGame}>START/STOP GAME</button>
                    </div>


                    <div id="console" style={{
                        position:"absolute",
                        top:"calc(60% + 30px)",
                        left:"20px",
                        width:"calc(100% - 40px)",
                        height:"calc(40% - 50px)",
                        backgroundColor:"#333",
                        color:"#fff",
                        fontFamily:"Roboto Mono, monospace",
                        fontSize:"0.9em"
                    }}>
                        <div id="redConsole" style={{
                            width:"calc(50% - 3px)",
                            position:"absolute",
                            left:"0px",
                            top:"0px",
                            height:"100%",
                            borderLeft:"3px solid red",
                            padding:"10px",
                            overflow:"scroll"
                        }}>
                            { this.state.logs[0].map((log, idx) =>
                                <span key={ idx }>
                                    <span style={{color:log.type==="error"?"red":"green"}}>[Robot { log.robot }{log.type==='error'?' Error':''}]</span> {log.message}
                                    <br /></span>
                            )}
                        </div>
                        <div id="blueConsole" style={{
                            width:"calc(50% - 3px)",
                            height:"100%",
                            borderLeft:"3px solid blue",
                            position:"absolute",
                            top:"0px",
                            left:"50%",
                            padding:"10px",
                            overflow:"scroll"
                        }}>
                            { this.state.logs[1].map((log, idx) =>
                                <span key={ idx }>
                                    <span style={{color:log.type==="error"?"red":"green"}}>[Robot { log.robot }{log.type==='error'?' Error':''}]</span> {log.message}
                                    <br /></span>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{
                    width:this.state.menu?"calc(100%-200px)":"100%",
                    borderBottom:"1px solid #ddd",
                    padding:"2px 10px 0px 10px",
                    fontSize:"1.2em"
                }}>
                    <i onClick={ this.showMenu } style={{cursor:"pointer"}} className="pe-7s-menu" />
                    <i onClick={ this.run } className="pe-7s-play pull-right" style={{cursor:"pointer", marginTop:"2px"}} />
                    <i onClick={ this.push } className="pe-7s-upload" style={{marginLeft:"10px", cursor:"pointer"}} />
                    <div style={{
                        fontSize: '0.6em',
                        display: 'inline-block'
                    }}>
                        <span id="submission-status" style={{
                            paddingTop: '0px',
                            paddingLeft: '10px',
                            display: 'block'
                        }}></span>
                    </div>
                </div>
                <div style={{
                    width:"100%",
                    height:"calc(100% - 30px)",
                    overflow:"hidden"
                }}>
                    <div style={{
                        width:this.state.menu?"150px":"0px",
                        height:"500px",
                        position:"absolute",
                        left:"0px",
                        float:"left",
                        overflow:"hidden",
                        transitionProperty:"width",
                        transitionDuration:"500ms",
                        zIndex:"50"
                    }}>
                        <div className="form-group" style={{padding:"10px", marginTop:"0px"}}>
                            <label>Theme</label>
                            <select className="form-control" id="theme" value={ this.state.theme }  onChange={ this.changeHandler }>
                                <option value='textmate'>Light</option>
                                <option value='monokai'>Dark</option>
                            </select>
                        </div>
                        <div className="form-group" style={{padding:"10px", marginTop:"-20px"}}>
                            <label>Autocomplete</label>
                            <select className="form-control" id="auto"  value={ this.state.auto } onChange={ this.changeHandler }>
                                <option value={false}>Off</option>
                                <option value={true}>On</option>
                            </select>
                        </div>
                        <div className="form-group" style={{padding:"10px", marginTop:"-20px"}}>
                            <label>Vimkeys</label>
                            <select className="form-control" id="vimkeys" value={ this.state.vimkeys } onChange={ this.changeHandler }>
                                <option value="">Off</option>
                                <option value="ace/keyboard/vim">On</option>
                            </select>
                        </div>
                        <div className="form-group" style={{padding:"10px", marginTop:"-20px"}}>
                            <label>Mapgen Seed</label>
                            <input className="form-control" id="seed"  value={ this.state.seed } onChange={ this.changeHandler } />
                        </div>
                        <div className="form-group" style={{padding:"10px", marginTop:"-20px"}}>
                            <label>Chess Timer</label>
                            <input className="form-control" style={{width:'45%', 'float':'left'}} id="chess_init" value={this.state.chess_init} onChange={ this.changeHandler } />
                            <input className="form-control" style={{width:'45%', 'float':'right'}} id="chess_extra" value={this.state.chess_extra} onChange={ this.changeHandler } />
                        </div>
                    </div>
                    <div id="firepad-container" style={{
                        width:this.state.menu?"calc(100%-150px)":"100%",
                        height:"100%",
                        position:"absolute",
                        top:"0px",
                        left:this.state.menu?"150px":"0px",
                        transitionProperty:"left",
                        transitionDuration:"500ms"
                    }} onClick={ this.hideSidebar }></div>
                </div>
            </div>
        );
    }
}

export default IDE;
