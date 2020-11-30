import {Config, Mode} from '../config';
import * as imageloader from '../imageloader';
import * as cst from '../constants';
import {Game} from 'battlecode-playback';

type ButtonInfo = {
  img: HTMLImageElement,
  text: string,
  onclick: () => void,
  changeTo?: string
};

/**
 * Game controls: pause/unpause, fast forward, rewind
 */
export default class Controls {
  div: HTMLDivElement;
  wrapper: HTMLDivElement;

  readonly timeReadout: Text;
  readonly speedReadout: HTMLSpanElement;
  readonly tileInfo: Text;
  readonly infoString: HTMLTableDataCellElement;
  
  winnerDiv: HTMLDivElement;

  /**
   * Callbacks initialized from outside Controls
   * Most of these are defined in ../app.ts
   * This is for easily modifing local variables of app.ts, such as goalUPS.
   */

  onGameLoaded: (data: ArrayBuffer) => void;
  onTogglePause: () => void;
  onToggleUPS: () => void;
  onToggleRewind: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSeek: (frame: number) => void;
  isPaused: () => Boolean;

  // qualities of progress bar
  canvas: HTMLCanvasElement;
  maxFrame: number;
  ctx;
  curUPS: number;

  // buttons
  readonly conf: Config;

  readonly buttons: {
    playbackStart: ButtonInfo,
    playbackPause: ButtonInfo,
    playbackStop: ButtonInfo,
    goNext: ButtonInfo,
    goPrevious: ButtonInfo,
    reverseUPS: ButtonInfo,
    doubleUPS: ButtonInfo,
    halveUPS: ButtonInfo,
  };

  constructor(conf: Config, images: imageloader.AllImages) {
    this.div = this.baseDiv();
    this.timeReadout = document.createTextNode('No match loaded');
    this.tileInfo = document.createTextNode('X | Y | Dirt | Water | Pollution | Soup');
    this.speedReadout = document.createElement('span');
    this.speedReadout.style.cssFloat = 'right';
    this.speedReadout.textContent = 'UPS: 0 FPS: 0';

    // initialize the images
    this.conf = conf;
    const imgs = images.controls;
    this.buttons = {
      playbackStart: { img: imgs.playbackStart, text: "Start", onclick: () => this.pause(), changeTo: 'playbackPause' },
      playbackPause: { img: imgs.playbackPause, text: "Pause", onclick: () => this.pause(), changeTo: 'playbackStart' },
      playbackStop: { img: imgs.playbackStop, text: "Stop", onclick: () => this.stop() },
      goNext: { img: imgs.goNext, text: "Next", onclick: () => this.stepForward() },
      goPrevious: { img: imgs.goPrevious, text: "Prev", onclick: () => this.stepBackward() },
      reverseUPS: { img: imgs.reverseUPS, text: "Reverse", onclick: () => this.reverseUPS() },
      doubleUPS: { img: imgs.doubleUPS, text: "Faster", onclick: () => this.doubleUPS() },
      halveUPS: { img: imgs.halveUPS, text: "Slower", onclick: () => this.halveUPS() },
    };


    let table = document.createElement("table");
    let tr = document.createElement("tr");

    // create the timeline
    let timeline = document.createElement("td");
    if (this.conf.tournamentMode) {
      timeline.style.width = '400px';
    }
    timeline.appendChild(this.timeline());
    if (this.conf.tournamentMode) {
      this.winnerDiv = document.createElement("div");
      timeline.append(this.winnerDiv);
    }
    timeline.appendChild(document.createElement("br"));
    timeline.appendChild(this.timeReadout);
    timeline.appendChild(this.speedReadout);

    this.curUPS = 16;
    if (this.conf.tournamentMode) {
      this.curUPS = 8; // for tournament!!!
    }

    // create the button controls
    let buttons = document.createElement("td");
    buttons.vAlign = "top";

    let reverseButton = this.createButton('reverseUPS');

    let halveButton = this.createButton('halveUPS');
    let goPreviousButton = this.createButton('goPrevious');
    let pauseStartButton = this.createButton('playbackStart');
    let goNextButton = this.createButton('goNext');
    let doubleButton = this.createButton('doubleUPS');

    let stopButton = this.createButton('playbackStop');

    buttons.appendChild(reverseButton);
    buttons.appendChild(halveButton);
    buttons.appendChild(goPreviousButton);
    buttons.appendChild(pauseStartButton);
    buttons.appendChild(goNextButton);
    buttons.appendChild(doubleButton);
    buttons.appendChild(stopButton);
    buttons.appendChild(document.createElement("br"));
    buttons.appendChild(this.tileInfo);

    pauseStartButton.title =  "Pause/resume";
    stopButton.title = "Stop";
    goPreviousButton.title = "Step back";
    goNextButton.title = "Step forward";
    doubleButton.title = "Double Speed";
    halveButton.title = "Halve Speed";
    reverseButton.title = "Play Reverse";

    // create the info string display
    let infoString = document.createElement("td");
    infoString.vAlign = "top";
    infoString.style.fontSize = "11px";
    this.infoString = infoString;

    table.appendChild(tr);
    tr.appendChild(timeline);
    tr.appendChild(document.createElement('div'));
    tr.appendChild(buttons);
    tr.appendChild(infoString);

    this.wrapper = document.createElement("div");
    this.wrapper.appendChild(table);
    this.div.appendChild(this.wrapper);
  }

  /**
   * @param content name of the image in this.imgs to display in the button
   * @param onclick function to call on click
   * @param hiddenContent name of the image in this.imgs to display as none
   * @return a button with the given attributes
   */
  private createButton(buttonId: string) {
    let button = document.createElement("button");
    button.setAttribute("class", "custom-button control-button");
    button.setAttribute("type", "button");
    button.id = buttonId;

    const info = this.buttons[buttonId];

    // button.innerText = info.text;
    button.appendChild(info.img);

    const changeTo = info.changeTo;
    if (changeTo != null) {
      let hiddenImage = this.buttons[changeTo].img;
      hiddenImage.style.display = "none";
      button.appendChild(hiddenImage);
    }
    button.onclick = info.onclick;

    return button;
  }

  /**
   * Make the controls look good
   */
  private baseDiv() {
    let div = document.createElement("div");
    div.id = "baseDiv";

    return div;
  }

  private timeline() {
    let canvas = document.createElement("canvas");
    canvas.id = "timelineCanvas";
    canvas.width = 400;
    canvas.height = 1;
    this.ctx = canvas.getContext("2d");
    this.ctx.fillStyle = "white";
    this.canvas = canvas;
    if (this.conf.tournamentMode) {
      canvas.style.display = 'none'; // we don't wanna reveal how many rounds there are!
    }
    return canvas;
  }

  /**
   * Returns the UPS determined by the slider
   */
  getUPS(): number {
    return this.curUPS;
  }

  /**
   * Displays the correct controls depending on whether we are in game mode
   * or map editor mode
   */
  setControls = () => {
    const mode = this.conf.mode;

    // The controls can be anything in help mode
    if (mode === Mode.HELP) return;

    // Otherwise clear the controls...
    while (this.div.firstChild) {
      this.div.removeChild(this.div.firstChild);
    }

    // ...and add the correct thing
    if (mode !== Mode.MAPEDITOR) {
      this.div.appendChild(this.wrapper);
    }
  };

  /**
   * Upload a battlecode match file.
   */
  loadMatch(files: FileList) {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.onGameLoaded(<ArrayBuffer>reader.result);
    };
    reader.readAsArrayBuffer(file);
  }

  /**
   * Pause our simulation.
   */
  pause() {
    this.onTogglePause();

    this.updatePlayPauseButton();
  }
  /**
   * Update play/pause button.
   */
  updatePlayPauseButton() {
    // toggle the play/pause button
    if (this.isPaused()) {
      this.buttons["playbackStart"].img.style.display = "unset";
      this.buttons["playbackPause"].img.style.display = "none";
    } else {
      this.buttons["playbackStart"].img.style.display = "none";
      this.buttons["playbackPause"].img.style.display = "unset";
    }

  }

  /**
   * Stop the match, and go to the first round
   */
  stop() {
    const pauseButton = document.getElementById("playbackPause");
    if (!this.isPaused() && pauseButton) {
      pauseButton.click();
    }
    this.onSeek(0);
  }

  /**
   * Steps forward one turn in the simulation
   */
  stepForward() {
    this.onStepForward();
  }

  /**
   * Steps backward one turn in the simulation
   */
  stepBackward() {
    this.onStepBackward();
  }

  /**
   * Doubles UPS (Max 128)
   */
  doubleUPS() {
    if (Math.abs(this.curUPS) < 128){
      this.curUPS = this.curUPS * 2;
    }
    this.onToggleUPS();
  }

  /**
   * Halves UPS (Min 1)
   */
  halveUPS() {
    if (Math.abs(this.curUPS) > 1){
      this.curUPS = this.curUPS / 2;
    }
    this.onToggleUPS();
  }

  /**
   * Changes the sign of UPS
   */
  reverseUPS() {
    this.curUPS = - this.curUPS;
    this.onToggleUPS();
  }

  /**
   * When the match is finished, set UPS to 0.
   */
  onFinish(game: Game) {
    if (!this.isPaused()) this.pause();
    if (this.conf.tournamentMode) {
      // also update the winner text
      this.setWinner(game);
    }
  }

  setWinner(game: Game) {
    console.log('winner: ' + game.getMatch(0).winner);
    const matchWinner = this.winnerTeam(game.meta.teams, game.getMatch(0).winner);
    while (this.winnerDiv.firstChild) {
      this.winnerDiv.removeChild(this.winnerDiv.firstChild);
    }
    this.winnerDiv.appendChild(matchWinner);
  }
  private winnerTeam(teams, winnerID: number | null): HTMLSpanElement {
    const span = document.createElement("span");
    if (winnerID === null) {
      return span;
    } else {
      // Find the winner
      let teamNumber = 1;
      for (let team in teams) {
        if (teams[team].teamID === winnerID) {
          span.className += team === "1" ? " red" : " blue";
          span.innerHTML = teams[team].name + " wins!";
          break;
        }
      }
    }
    return span;
  }

  /**
   * Redraws the timeline and sets the current round displayed in the controls.
   */
  // TODO scale should be constant; should not depend on loadedTime
  setTime(time: number, loadedTime: number, ups: number, fps: number, lagging: Boolean) {

    if (this.conf.tournamentMode) {
      // TOURNAMENT MODE
      let speedText = (lagging ? '(Lagging) ' : '') + `UPS: ${ups | 0} FPS: ${fps | 0}`;
      speedText = speedText.padStart(32);
      this.speedReadout.textContent = speedText;
      this.timeReadout.textContent = `Round: ${time}`;
      return;
    }

    // Redraw the timeline
    const scale = this.canvas.width / loadedTime;
    // const scale = this.canvas.width / cst.MAX_ROUND_NUM;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "rgb(39, 39, 39)";
    this.ctx.fillRect(0, 0, time * scale, this.canvas.height);

    this.ctx.fillStyle = "#777";
    this.ctx.fillRect(time * scale, 0, (loadedTime - time) * scale, this.canvas.height);

    this.ctx.fillStyle = 'rgb(255,0,0)';
    this.ctx.fillRect(time * scale, 0, 2, this.canvas.height);

    // Edit the text
    this.timeReadout.textContent = `Round: ${time}/${loadedTime}`;

    let speedText = (lagging ? '(Lagging) ' : '') + `UPS: ${ups | 0} FPS: ${fps | 0}`;
    speedText = speedText.padStart(32);
    this.speedReadout.textContent = speedText;
  }

  /**
   * Updates the location readout
   */
  setTileInfo(x: number, y: number, dirt: number, water: number, pollution: number, soup: number): void {
    let content: string = "";
    content += 'X: ' + `${x}`.padStart(3);
    content += ' | Y: ' + `${y}`.padStart(3);
    if(dirt !== undefined) content += ' | D: ' + `${dirt}`.padStart(3);
    if(water !== undefined) content += ' | W: ' + `${water}`.padStart(3);
    if(pollution !== undefined) content += ' | P: ' + `${pollution}`.padStart(3);
    if(soup !== undefined) content += ' | S: ' + `${soup}`.padStart(3);

    this.tileInfo.textContent = content;
  }

  /**
   * Display an info string in the controls bar
   * "Robot ID id
   * Location: (x, y)
   * onDirt, carryDirt
   * Bytecodes Used: bytecodes"
   */
  // TODO fix this (different stats)
  setInfoString(id, x: number, y: number, onDirt: number, carryDirt?: number, bytecodes?: number): void {
    // console.log(carryDirt);
    let infoString = `Robot ID ${id} <br>
      Location: (${x}, ${y})<br>
      Dirt on this: ${onDirt}`;

      if (carryDirt !== undefined) {
        infoString += `, Carrying ${carryDirt} dirt`;
      }

      if (bytecodes !== undefined) {
        infoString += `<br>Bytecodes Used: ${bytecodes}`;
      }
      this.infoString.innerHTML = infoString;
  }
}
