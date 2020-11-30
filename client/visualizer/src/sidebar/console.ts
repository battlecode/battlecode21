import {Config} from '../config';
import {Log} from 'battlecode-playback';

/**
 * Displays the logs produced by the player
 *
 * Eventually this should have an object containing pre-processed console
 * output from playback. The console should have options to filter output
 * based on round number, robot ID, team, etc.
 */
export default class Console {

  // The public div
  readonly div: HTMLDivElement;

  // HTML Elements
  private console: HTMLDivElement;
  private teamAInput: HTMLInputElement;
  private teamBInput: HTMLInputElement;
  private lengthInput: HTMLInputElement;

  // Filters
  // use teamA(), teamB(), minRound(), and maxRound() to get the other filters
  private robotID: number | undefined;
  private currentRound: number;

  // Options
  private readonly MIN_ROUNDS: number = 1;
  private readonly MAX_ROUNDS: number = 3000;
  private readonly DEFAULT_MAX_ROUNDS: number = 15;
  private readonly conf: Config;

  // Used to check if there are more logs to pull from the match.
  private lastLoadedRound: number;

  // Note: this is a reference to an Array<Array<Log>> in a Match, and may have
  // more logs added behind our backs.
  // On the other hand, it may not have logs for a round at all.
  private logsRef: Array<Array<Log>> | null;

  // Invariants:
  // - consoleDivs are the div objects displayed in the console
  // - consoleDivs.length === consoleLogs.length, and consoleDivs[i] and
  //   consoleLogs[i] are the corresponding div and log
  // - The logs in consoleLogs are in chronological order by round
  private consoleLogs: Array<Log>;
  private consoleDivs: Array<HTMLDivElement>;

  constructor(conf: Config) {
    this.conf = conf;
    this.robotID = undefined;
    this.currentRound = 1;
    this.lastLoadedRound = 0;

    this.consoleLogs = new Array();
    this.consoleDivs = new Array();
    this.div = this.basediv();
  }

  /**
   * The console.
   */
  private basediv(): HTMLDivElement {
    let div = document.createElement("div");

    this.teamAInput = this.getHTMLCheckbox("A");
    this.teamBInput = this.getHTMLCheckbox("B");
    this.lengthInput = this.getHTMLInput();

    // Add a tip
    const span = document.createElement("span");
    const p = document.createElement('p');
    p.appendChild(document.createTextNode("(Click a robot to filter by robot ID.)"));
    p.style.fontSize = "12px";
    span.appendChild(p);
    span.style.fontFamily = "Tahoma, sans-serif";
    div.appendChild(span);

    // Add the team filter
    div.appendChild(this.teamAInput);
    const spanA = document.createElement("span");
    spanA.appendChild(document.createTextNode("Team A"));
    spanA.className = "red";
    div.appendChild(spanA);

    div.appendChild(this.teamBInput);
    const spanB = document.createElement("span");
    spanB.appendChild(document.createTextNode("Team B"));
    spanB.className = "blue";
    div.appendChild(spanB);
    div.appendChild(document.createElement("br"));

    // Add the round filter
    div.appendChild(document.createTextNode("Max Number of Rounds:"));
    div.appendChild(this.lengthInput);
    div.appendChild(document.createElement("br"));

    // Add the console
    this.console = document.createElement("div");
    this.console.id = "robotLogs";
    this.console.className = "console";
    div.appendChild(this.console);

    this.updateLogHeader();


    return div;
  }

  /**
   * Parameter team is "A" or "B"
   * Returns the HTML checkbox element for filtering teams
   */
  private getHTMLCheckbox(team: string): HTMLInputElement {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = team;
    checkbox.checked = true;
    checkbox.onchange = () => {
      this.applyFilter();
    }
    return checkbox;
  }

  /**
   * Returns the HTML input element for filtering number of records
   */
  private getHTMLInput(): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "text";
    input.value = String(this.DEFAULT_MAX_ROUNDS);
    input.onchange = () => {
      // Input validation, must be a number between 1 and 50,
      // Defaults to this.DEFAULT_MAX_ROUNDS otherwise.
      const value: number = parseInt(input.value);
      if (isNaN(value)) {
        input.value = String(this.DEFAULT_MAX_ROUNDS);
      } else if (value < this.MIN_ROUNDS) {
        input.value = String(this.MIN_ROUNDS);
      } else if (value > this.MAX_ROUNDS) {
        input.value = String(this.MAX_ROUNDS);
      }

      // Then reapply the filter
      this.applyFilter();
    }
    return input;
  }

  /**
   * Set the logs we should be checking.
   */
  setLogsRef(logsRef: Array<Array<Log>>): void {
    this.logsRef = logsRef;
  }

  /**
   * Jumps to a round and updates the console.
   */
  seekRound(round: number): void {
    // Update the round numbers
    const previousRound = this.currentRound;
    this.currentRound = round;

    if (this.currentRound === previousRound) {
      // We are in the same round, don't to anything
      return;
    } else if (this.currentRound === previousRound + 1) {
      // We went forward a single round; just push and shift for efficiency
      this.shiftRound();
      this.pushRound(this.maxRound());
    } else {
      // Otherwise we need to reapply the entire filter
      this.applyFilter();
    }
  }

  /**
   * Sets the ID filter and updates the console.
   */
  setIDFilter(id: number | undefined): void {
    this.robotID = id;
    this.applyFilter();
  }

  /**
   * Removes all the logs from the minimum round, which may be at most the
   * earliest round currently displayed in the console. If it is less than the
   * earliest round, does nothing.
   */
  private shiftRound(): void {
    const minRound = this.minRound();
    while (this.consoleLogs.length > 0) {
      // If the first log in the console is from after minRound, we're done.
      const log = this.consoleLogs[0];
      if (log.round > minRound) {

        return;
      }
      // Otherwise, remove it
      this.shiftLine();
    }
  }

  /**
   * Pushes all logs from the current round that match the filter, or does
   * nothing if there are no logs for that round.
   */
  private pushRound(round: number): void {
    // If logs exist for this round
    if (this.logsRef != null && this.logsRef[round] != undefined) {
      const logs = this.logsRef[round];

      // For each log in the round, add it to the console if it's good
      logs.forEach((log: Log) => {
        if (this.isGood(log)) {
          this.pushLine(log);
        }
      });

      // Update the scroll height
      this.console.scrollTop = this.console.scrollHeight;
    }
  }

  /**
   * Update log header using conf info
   */
  public updateLogHeader(): void {
    var sheet = document.createElement('style')
    sheet.innerHTML = ".consolelogheader1 {display: none;} .consolelogheader2 {display: unset;}";
    sheet.id = 'consolelogheaderstylesheet';
    var sheet2 = document.createElement('style')
    sheet2.innerHTML = ".consolelogheader1 {display: unset;} .consolelogheader2 {display: none;}";
    sheet2.id = 'consolelogheaderstylesheet';
    let d = document.getElementById('consolelogheaderstylesheet');
    d?.parentNode?.removeChild(d);
    if (this.conf.shorterLogHeader) {
      document.body.appendChild(sheet);
    } else {
      document.body.appendChild(sheet2);
    }
  }

  /**
   * Removes the earliest line from the console output, if it exists. Returns
   * true iff a line was successfully removed.
   * (Maintains the invariant for consoleLogs and consoleDivs)
   */
  private shiftLine(): boolean {
    if (this.consoleLogs.length === 0) {
      // There is nothing in the console

      return false;
    }

    // Remove the div from the console
    this.consoleDivs[0].remove();

    // Maintain the invariant
    this.consoleLogs.shift();
    this.consoleDivs.shift();
    return true;
  }

  /**
   * Add a line to the console output.
   * (Maintains the invariant for consoleLogs and consoleDivs)
   */
  private pushLine(log: Log): void {
    const div = document.createElement("div");
    // Replace \n with <br>
    const span = document.createElement("span");
    const text = log.text.split("\n").join("<br>");
    span.innerHTML = text;
    div.appendChild(span);
    this.console.appendChild(div);

    // Maintain the invariant
    this.consoleLogs.push(log);
    this.consoleDivs.push(div);
  }

  /**
   * Apply a filter by clearing the console and pushing all the logs that match
   * the filter within the defined rounds.
   */
  private applyFilter(): void {
    // Remove all the current elements
    while (this.console.firstChild) {
      this.console.removeChild(this.console.firstChild);
    }

    // Maintain the invariant
    this.consoleDivs = new Array();
    this.consoleLogs = new Array();

    // Push all the logs from the defined rounds that match the filter
    for (let round = this.minRound(); round <= this.maxRound(); round++) {
      this.pushRound(round);
    }
  }

  /**
   * Returns true iff the Log matches the current filter
   */
  private isGood(log: Log): boolean {
    const teamSelected: boolean = log.team === "A" ? this.teamA() : this.teamB();
    const idSelected: boolean = this.robotID === undefined || this.robotID === log.id;
    const roundSelected: boolean = this.minRound() <= log.round && log.round <= this.maxRound();
    return teamSelected && idSelected && roundSelected;
  }

  /**
   * Returns true iff team A is included in the filter
   */
  private teamA(): boolean {
    return this.teamAInput.checked;
  }

  /**
   * Returns true iff team B is included in the filter
   */
  private teamB(): boolean {
    return this.teamBInput.checked;
  }

  /**
   * Returns the minimum round (inclusive) in the filter
   */
  private minRound(): number {
    return Math.max(this.MIN_ROUNDS, this.currentRound - parseInt(this.lengthInput.value) + 1);
  }

  /**
   * Returns the maximum round (inclusive) in the filter
   */
  private maxRound(): number {
    return Math.min(this.MAX_ROUNDS, this.currentRound);
  }
}
