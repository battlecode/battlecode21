import {Config, Mode} from '../config';
import {AllImages} from '../imageloader';

import Stats from '../sidebar/stats';
import Console from '../sidebar/console';
import MatchRunner from '../sidebar/matchrunner';
import MatchQueue from '../sidebar/matchqueue';
import Profiler from '../sidebar/profiler';
import MapEditor from '../mapeditor/mapeditor';
import ScaffoldCommunicator from './scaffold';
import Runner from '../runner';

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
  readonly profiler?: Profiler;
  private readonly help: HTMLDivElement;

  // Options
  private readonly conf: Config;

  // Scaffold
  private scaffold: ScaffoldCommunicator;

  // Update texts
  private updateText: HTMLDivElement;

  // Mode panel
  private modePanel: HTMLTableElement;

  // Callback to update the game area when changing modes
  cb: () => void;

  constructor(conf: Config, images: AllImages, runner: Runner) {
    // Initialize fields
    this.div = document.createElement("div");
    this.innerDiv = document.createElement("div");
    this.images = images;
    this.console = new Console(conf);
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
    if (conf.useProfiler) this.profiler = new Profiler(conf);
    this.matchqueue = new MatchQueue(conf, images, runner);
    this.stats = new Stats(conf, images, runner);
    this.conf = conf;
    this.help = this.initializeHelp();

    // Initialize div structure
    this.loadStyles();
    this.div.appendChild(this.screamForUpdate());
    this.div.appendChild(this.battlecodeLogo());

    this.modePanel = document.createElement('table');
    this.modePanel.className = 'modepanel';

    const modePanelRow1 = document.createElement('tr');
    const modePanelRow2 = document.createElement('tr');

    this.modeButtons = new Map<Mode, HTMLButtonElement>();
    modePanelRow1.appendChild(this.modeButton(Mode.GAME, "Game"));
    modePanelRow1.appendChild(this.modeButton(Mode.LOGS, "Logs"));
    modePanelRow1.appendChild(this.modeButton(Mode.QUEUE, "Queue"));
    modePanelRow1.appendChild(this.modeButton(Mode.RUNNER, "Runner"));
    if (this.conf.useProfiler) modePanelRow2.appendChild(this.modeButton(Mode.PROFILER, "Profiler"));
    modePanelRow2.appendChild(this.modeButton(Mode.MAPEDITOR, "Map Editor"));
    modePanelRow2.appendChild(this.modeButton(Mode.HELP, "Help"));

    this.modePanel.appendChild(modePanelRow1);
    this.modePanel.appendChild(modePanelRow2);

    this.div.appendChild(this.modePanel);

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
    var innerHTML: string =
    `
    <b class="red" style="font-size: 16px">Beware of too much logging!</b>
    <br>
    If your match has a significant amount of logging, please <b>turn off log processing with
    the L key.</b><br>
    <br>
    <b class="red">Issues?</b>
    <ol style="margin-left: -20px; margin-top: 0px;">
    <li>Refresh (Ctrl-R or Command-R).</li>
    <li>Search <a href="https://discordapp.com/channels/386965718572466197/401552673523892227">Discord</a>.</li>
    <li>Ask on <a href="https://discordapp.com/channels/386965718572466197/401552673523892227">Discord</a> (attach a screenshot of console output using F12).</li>
    </ol>
    <b class="blue">Keyboard Shortcuts (Game)</b><br>
    LEFT - Step Back One Turn<br>
    RIGHT - Step Forward One Turn<br>
    UP - Double Playback Speed<br>
    DOWN - Halve Playback Speed<br>
    P - Pause/Unpause<br>
    O - Stop (Go to Start)<br>
    E - Go to End<br>
    V - Toggle Indicator Dots/Lines for Selected Robot<br>
    C - Toggle All Indicator Dots/Lines<br>
    G - Toggle Grid<br>
    N - Toggle Action Radius<br>
    M - Toggle Sensor Radius<br>
    , - Toggle Detection Radius<br>
    H - Toggle Shorter Log Headers<br>
    B - Toggle Interpolation<br>
    L - Toggle whether to process logs.<br>
    Q - Toggle whether to profile matches.<br>
    Z - Toggle whether to rotate tall maps.<br>
    [ - Hide/unhide sidebar navigation.<br>
    <br>
    <b class="blue">Keyboard Shortcuts (Map Editor)</b><br
    <br>
    S - Add<br>
    D - Delete<br>
    R - Reverse team<br>
    <br>
    <b class="blue">How to Play a Match</b><br>
    <i>From the application:</i> Click <code>Runner</code>, select the bots and
    your desired map, then press "Run Game". Note that it may take a few seconds for
    matches to be displayed. To stop processing a match before it has finished,
    press "Kill ongoing processes". Note that the part of the match that has already
    loaded will remain in the client.<br>
    <br>
    <i>From the web client:</i> You can always upload a <code>.bc21</code> file by
    clicking the upload button in the <code>Queue</code> section.<br>
    <br>
    Use the control buttons at the top of the screen to
    navigate the match. Click on different matches in the <code>Queue</code> section to switch between them.<br>
    <br>
    <b class="blue">How to Use the Console</b><br>
    The console displays all <code>System.out.println()</code> data up to the current round.
    You can filter teams by checking the boxes and robot IDs by clicking the
    robot. You can also change the maximum number of rounds displayed in the
    input box. Beware of doing too much logging! This slows down the client.
    (WARNING: If you want to, say, suddenly display 3000 rounds
    of data, pause the client first to prevent freezing.)<br>
    <br>
    <b class="blue">How to Use the Profiler</b><br>
    <i class="red"> Be cautious of memory issues when profiling large games. To disable profiling
    on a profiled match file, press "Q".</i><br>
    The profiler can be used to find out which methods are using a lot of
    bytecodes. To use it, tick the "Profiler enabled" checkbox in the
    Runner before running the game. Make sure that the runFromClient
    Gradle task sets bc.engine.enable-profiler to the value of the
    "profilerEnabled" property, as can be seen in the
    <a href="https://github.com/battlecode/battlecode21-scaffold/blob/master/build.gradle" target="_blank">scaffold player</a>.
    Make sure to add the "profilerEnabled" property to your
    <a href="https://github.com/battlecode/battlecode21-scaffold/blob/master/gradle.properties" target="_blank">gradle.properties</a>
    file as well. A maximum of 2,000,000 events are recorded per team per
    match if profiling is enabled to prevent the replay file from becoming
    enormous.
    <br>
    <br>
    <b class="blue">How to Use the Map Editor</b><br>
    Select the initial map settings: name, width, height, and symmetry. <br>
    <br>
    To place enlightenment centers, enter the "change robots" mode, set the coordinates, set the initial influence of the
    center (abbreviated as "I"), and click "Add/Update" or "Delete." The coordinates can also be set by clicking the map.
    <!--The "ID" of a robot is a unique identifier for a pair of symmetric robots. It is not the ID the robot will have in the game! --><br>
    <br>
    To set tiles' passability values, enter the "change tiles" mode, select the passability value, brush size, and brush style,
    and then <b>hold and drag</b> your mouse across the map. <br>
    <br>
    To save an intermediary version of your map, copy the map JSON. You can input this JSON later to retrieve your map in the map editor for further editing. <br>
    <br>
    <!--Before exporting, click "Validate" to see if any changes need to be
    made, and <b>"Remove Invalid Units"</b> to automatically remove off-map or
    overlapping units. -->
    When you are happy with your map, click "Export".
    If you are directed to save your map, save it in the
    <code>/battlecode-scaffold-2021/maps</code> directory of your scaffold.
    (Note: the name of your <code>.map21</code> file must be the same as the name of your
    map.) <br>
    <br>
    Exported file name must be the same as the map name chosen above. For instance, <code>DefaultMap.bc21</code>.`;

    if (this.conf.tournamentMode) {
      innerHTML += 
      `<br><br>
      <b class="blue">Tournament Mode Keyboard Shortcuts</b><br>
      D - Next match<br>
      A - Previous match`
    }

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
          host: '2021.battlecode.org',
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
    boldText.innerHTML = "Battlecode 2021";
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
      case Mode.MAPEDITOR:
        this.innerDiv.appendChild(this.mapeditor.div);
        break;
      case Mode.PROFILER:
        if (this.profiler) this.innerDiv.append(this.profiler.div);
        break;
    }

    if (this.cb !== undefined) {
      this.cb();
    }
  }

  hidePanel() {
    this.modePanel.style.display = (this.modePanel.style.display === "" ? "none" : "");
  }
}
