import {Config, Mode} from '../config';
import {AllImages} from './imageloader';

import Stats from '../sidebar/stats';
import Console from '../sidebar/console';
import MatchRunner from '../sidebar/matchrunner';
import MatchQueue from '../sidebar/matchqueue';
import Profiler from '../sidebar/profiler';
import MapEditor from '../mapeditor/mapeditor';
import ScaffoldCommunicator from './scaffold';

import {http,electron} from './electron-modules';


export default class Sidebar {

  // HTML elements
  readonly div: HTMLDivElement; // The public div
  private readonly innerDiv: HTMLDivElement;
  private readonly images: AllImages;
  private readonly modeButtons: Map<Mode, HTMLButtonElement>;

  // Different modes
  readonly stats: Stats;
  readonly console: Console;
  readonly mapeditor: MapEditor;
  readonly matchrunner: MatchRunner;
  readonly matchqueue: MatchQueue;
  readonly profiler: Profiler;
  private readonly help: HTMLDivElement;

  // Options
  private readonly conf: Config;

  // Scaffold
  private scaffold: ScaffoldCommunicator;

  // Update texts
  private updateText: HTMLDivElement;

  // onkeydown event that uses the controls depending on the game mode
  private readonly onkeydownControls: (event: KeyboardEvent) => void;

  // Callback to update the game area when changing modes
  cb: () => void;

  // onkeydownControls is an onkeydown event that uses the controls depending on the game mode
  constructor(conf: Config, images: AllImages,
    onkeydownControls: (event: KeyboardEvent) => void) {
    // Initialize fields
    this.div = document.createElement("div");
    this.innerDiv = document.createElement("div");
    this.images = images;
    this.console = new Console(conf);
    this.stats = new Stats(conf, images);
    this.mapeditor = new MapEditor(conf, images);
    this.matchrunner = new MatchRunner(conf, () => {
      // Set callback for matchrunner in case the scaffold is loaded later
      electron.remote.dialog.showOpenDialog({
        title: 'Please select your battlecode-scaffold directory.',
        properties: ['openDirectory']
      }).then((result) => {
        let filePaths = result.filePaths;
        if (filePaths.length > 0) {
          this.scaffold = new ScaffoldCommunicator(filePaths[0]);
          this.addScaffold(this.scaffold);
        } else {
          console.log('No scaffold found or provided');
        }
      })
    }, () => {
      // set callback for running a game, which should trigger the update check
      this.updateUpdate();
    });
    this.profiler = new Profiler();
    this.matchqueue = new MatchQueue(conf, images, this.profiler);
    this.help = this.initializeHelp();
    this.conf = conf;
    this.onkeydownControls = onkeydownControls;

    // Initialize div structure
    this.loadStyles();
    this.div.appendChild(this.screamForUpdate());
    this.div.appendChild(this.battlecodeLogo());

    const modePanel = document.createElement('table');
    modePanel.className = 'modepanel';
    const modePanelRow = document.createElement('tr');
    this.modeButtons = new Map<Mode, HTMLButtonElement>();
    modePanelRow.appendChild(this.modeButton(Mode.GAME, "Game"));
    modePanelRow.appendChild(this.modeButton(Mode.LOGS, "Logs"));
    modePanelRow.appendChild(this.modeButton(Mode.QUEUE, "Queue"));
    modePanelRow.appendChild(this.modeButton(Mode.RUNNER, "Runner"));
    modePanelRow.appendChild(this.modeButton(Mode.PROFILER, "Profiler"));
    // modePanelRow.appendChild(this.modeButton(Mode.MAPEDITOR, "Map Editor"));
    modePanelRow.appendChild(this.modeButton(Mode.HELP, "Help"));
    modePanel.appendChild(modePanelRow);
    this.div.appendChild(modePanel);

    this.div.appendChild(this.innerDiv);

    this.conf.mode = Mode.GAME;

    this.updateModeButtons();
    this.setSidebar();
  }


  /**
   * Sets a scaffold if a scaffold directory is found after everything is loaded
   */
  addScaffold(scaffold: ScaffoldCommunicator): void {
    this.mapeditor.addScaffold(scaffold);
    this.matchrunner.addScaffold(scaffold);
  }

  /**
   * Initializes the help div
   */
  private initializeHelp(): HTMLDivElement {
    const innerHTML: string =
    `
    <b class="red">Issues?</b>
    <ol style="margin-left: -20px; margin-top: 0px;">
    <li>Refresh (Ctrl-R or Command-R).</li>
    <li>Search <a href="https://discordapp.com/channels/386965718572466197/401552673523892227">Discord</a>.</li>
    <li>Ask on <a href="https://discordapp.com/channels/386965718572466197/401552673523892227">Discord</a> (attach a screenshot of console output using F12).</li>
    </ol>
    <b class="blue">Keyboard Shortcuts</b><br>
    LEFT - Step Back One Turn<br>
    RIGHT - Step Forward One Turn<br>
    UP - Double Playback Speed<br>
    DOWN - Halve Playback Speed<br>
    P - Pause/Unpause<br>
    O - Stop<br>
    V - Toggle Indicator Dots/Lines<br>
    G - Toggle Grid<br>
    N - Toggle Sight/Sensor Radius<br>
    H - Toggle Shorter Log Headers<br>
    B - Toggle Interpolation<br>
    <br>
    <b class="red">How to Play a Match</b><br>
    <i>From the application:</i> Click <b>'Runner'</b> and follow the
    instructions in the sidebar. Note that it may take a few seconds for
    matches to be displayed.<br>
    <i>From the web client:</i> If you are not running the client as a
    stand-alone application, you can always upload a <b>.bc20</b> file by
    clicking upload button in the <b>'Queue'</b> section.<br>
    <br>
    Use the control buttons in <b>'Queue'</b> and the top of the screen to
    navigate the match.<br>
    <br>
    <b class="blue">How to Use the Console</b><br>
    The console displays all System.out.println() data up to the current round.
    You can filter teams by checking the boxes and robot IDs by clicking the
    robot. You can also change the maximum number of rounds displayed in the
    input box. (WARNING: If you want to, say, suddenly display 3000 rounds
    of data on round 2999, pause the client first to prevent freezing.)<br>
    <br>
    <b class="red">How to Use the Profiler</b><br>
    The profiler can be used to find out which methods are using a lot of
    bytecodes. To use it, tick the "Profiler enabled" checkbox in the
    Runner before running the game. Make sure that the runFromClient
    Gradle task sets bc.engine.enable-profiler to the value of the
    "profilerEnabled" property, as can be seen in the
    <a href="https://github.com/battlecode/battlecode20-scaffold/blob/master/build.gradle" target="_blank">scaffold player</a>.
    Make sure to add the "profilerEnabled" property to your
    <a href="https://github.com/battlecode/battlecode20-scaffold/blob/master/gradle.properties" target="_blank">gradle.properties</a>
    file as well.

    Note that for games with a large number of units, it might be impossible
    to run the profiler successfully (you might get an <code>OutOfMemoryError</code>).
    <br>
    <br>
    <!---
    <b class="blue">How to Use the Map Editor</b><br>
    Select the initial map settings: name, width, height, symmetry. Add trees
    and archons by setting the coordinates and radius, and clicking
    <b>"Add/Update."</b> The coordinates can also be set by clicking the map.
    The radius will automatically adjust to the maximum valid radius if the
    input is too large, and an archon always has radius 2. If the radius is 0,
    no unit of that type can be placed there.<br>
    <br>
    Modify or delete existing units by clicking on them, making changes, then
    clicking <b>“Add/Update."</b><br>
    <br>
    Before exporting, click <b>"Validate"</b> to see if any changes need to be
    made, and <b>"Remove Invalid Units"</b> to automatically remove off-map or
    overlapping units. When you are happy with your map, click <b>“EXPORT!”</b>.
    If you are directed to save your map, save it in the
    <b>/battlecode-scaffold-2017-master/maps</b> directory of your scaffold.
    (Note: the name of your .map17 file must be the same as the name of your
    map.)-->`;

    const div = document.createElement("div");
    div.id = "helpDiv";

    div.innerHTML = innerHTML;
    return div;
  }

  /**
   * Initializes the styles for the sidebar div
   */
  private loadStyles(): void {

    this.div.id = "sidebar";

  }

  /**
   * Scream for update, if outdated.
   */
  private screamForUpdate(): HTMLDivElement {
    this.updateText = document.createElement("div");
    this.updateText.id = "updateText";

    this.updateUpdate();

    return this.updateText;
  }
  private updateUpdate() {
    this.updateText.style.display = "none";
    if (process.env.ELECTRON) {
      (async function (splashDiv, version) {

        var options = {
          host: '2020.battlecode.org',
          path: '/version.txt'
        };

        var req = http.get(options, function(res) {
          let data = "";
          res.on('data', function(chunk) {
            data += chunk
          }).on('end', function() {

            var latest = data;

            if(latest.trim() != version.trim()) {
              let newVersion = document.createElement("p");
              newVersion.innerHTML = "NEW VERSION AVAILABLE!!!! (download with <code>gradle update</code> followed by <code>gradle build</code>, and then restart the client): v" + latest;
              splashDiv.style.display = "unset";
              while (splashDiv.firstChild) {
                splashDiv.removeChild(splashDiv.firstChild);
              }
              splashDiv.appendChild(newVersion);
            }

          })
        });
      })(this.updateText, this.conf.gameVersion);
    }
  }

  /**
   * Battlecode logo or title, at the top of the sidebar
   */
  private battlecodeLogo(): HTMLDivElement {
    let logo: HTMLDivElement = document.createElement("div");
    logo.id = "logo";

    let boldText = document.createElement("b");
    boldText.innerHTML = "Battlecode 2020";
    logo.appendChild(boldText);
    return logo;
  }

  private updateModeButtons() {
    this.modeButtons.forEach(button => {
      button.className = 'modebutton';
    });
    let modeButton = this.modeButtons.get(this.conf.mode);
    if (modeButton !== undefined)
      modeButton.className = 'modebutton selectedmodebutton';
  }

  private modeButton(mode: Mode, text: string): HTMLTableDataCellElement {
    const cellButton = document.createElement('td');
    const button = document.createElement("button");
    button.type = "button";
    button.className = 'modebutton';
    button.innerHTML = text;
    button.onclick = () => {
      this.conf.mode = mode;
      this.updateModeButtons();
      this.setSidebar();
    };
    this.modeButtons.set(mode, button);
    cellButton.appendChild(button);
    return cellButton;
  }

  /**
   * Update the inner div depending on the mode
   */
  private setSidebar(): void {
    // Clear the sidebar
    while (this.innerDiv.firstChild) {
      this.innerDiv.removeChild(this.innerDiv.firstChild);
    }

    // Update the div and set the correct onkeydown events
    // TODO why does the sidebar need config? (like, circlebots or indicators)
    // this seems it was not updated for a while
    switch (this.conf.mode) {
      case Mode.GAME:
        this.innerDiv.appendChild(this.stats.div);
        break;
      case Mode.HELP:
        this.innerDiv.appendChild(this.help);
        break;
      case Mode.LOGS:
        this.innerDiv.appendChild(this.console.div);
        break;
      case Mode.RUNNER:
        this.innerDiv.appendChild(this.matchrunner.div);
        break;
      case Mode.QUEUE:
        this.innerDiv.appendChild(this.matchqueue.div);
        break;
      case Mode.PROFILER:
        this.innerDiv.append(this.profiler.div);
        break;
    }

    if (this.cb !== undefined) {
      this.cb();
    }
  }
}
