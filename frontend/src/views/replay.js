import 'rc-slider/assets/index.css';
import React, { Component } from 'react';
import Api from '../api';
import Visualizer from './visualizer';
import ReactDropzone from 'react-dropzone';
import Slider from 'rc-slider';

class ReplayViewer extends Component {
    constructor(props) {
        super(props);

        this.onDrop = this.onDrop.bind(this);
        this.changeSlider = this.changeSlider.bind(this);
        this.startStop = this.startStop.bind(this);
        this.changeSpeed = this.changeSpeed.bind(this);

        this.state = {
            turn:null,
            numTurns:0,
            extraWait:0
        };
    }

    componentDidMount() {
        // Check for ? in url, if so, grab replay url
        var url = window.location.href.split('?');

        if (url.length === 2) {
            var replay_url = url[url.length-1];

            var pixx = document.getElementById('pixi');

            var windWid = pixx.offsetWidth;
            var windHeigh = window.innerHeight-100;
            var wid = Math.min(windWid, windHeigh*1.25);
            var heigh = Math.min(windHeigh, windWid/1.25);


            Api.getReplayFromURL(replay_url, function(replay) {
                this.v = new Visualizer("pixi", replay, function(turn) {
                    this.setState({turn:turn});
                }.bind(this), wid, heigh);
                this.setState({numTurns:this.v.numTurns()});
            }.bind(this));
        }
    }

    onDrop(files) {
        var reader = new FileReader();

        var pixx = document.getElementById('pixi');

        var windWid = pixx.offsetWidth;
        var windHeigh = window.innerHeight-100;
        var wid = Math.min(windWid, windHeigh*1.25);
        var heigh = Math.min(windHeigh, windWid/1.25);

        reader.onload = function() {
            this.v = new Visualizer("pixi", new Uint8Array(reader.result), function(turn) {
                this.setState({turn:turn});
            }.bind(this), wid, heigh);
            this.setState({numTurns:this.v.numTurns()});
        }.bind(this);

        reader.readAsArrayBuffer(files[0]);
    }

    changeSlider(turn) {
        if (this.v) {
            this.v.goToTurn(turn);
            this.setState({turn:turn});
        }
    }

    startStop() {
        this.v.startStop();
    }

    changeSpeed(newSpeed) {
        var ns = newSpeed;
        this.setState({extraWait:ns});
        if (this.v) {
            this.v.extraWait = ns;
            this.startStop();
            this.startStop();
        }
    }

    render() {
        return (
            <div className="content">
                <div id="pixi"></div>
                <Slider style={{display:(this.v == null)?'none':'block', 'width':'100%'}} max={this.state.numTurns} onChange={this.changeSlider} value={this.state.turn} />
                <button style={{display:(this.v == null)?'none':'block'}} onClick={this.startStop}>START/STOP</button>
                <Slider style={{display:(this.v == null)?'none':'block', 'width': '200px'}} max={200} onChange={this.changeSpeed} value={this.state.extraWait} />
                <div id="dropzonehej" style={{display:(this.v == null)?'block':'none'}}><ReactDropzone onDrop={this.onDrop}>
                    {({getRootProps, getInputProps}) => (
                        <div {...getRootProps()}>
                            <input {...getInputProps()} />
                            <p>Drop files here, or click to select files</p>
                        </div>
                    )}
                </ReactDropzone></div>
            </div>
        );
    }
}

export default ReplayViewer;