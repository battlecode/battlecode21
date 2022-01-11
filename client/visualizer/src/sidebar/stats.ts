import { Config } from '../config';
import * as cst from '../constants';
import { AllImages } from '../imageloader';
import { schema } from 'battlecode-playback';
import Runner from '../runner';
import Chart = require('chart.js');

const hex: Object = {
  1: "#db3627",
  2: "#4f7ee6"
};

type VoteBar = {
  bar: HTMLDivElement,
  vote: HTMLSpanElement,
  bid: HTMLSpanElement
};

type BuffDisplay = {
  numBuffs: HTMLSpanElement,
  buff: HTMLSpanElement
}

type IncomeDisplay = {
  income: HTMLSpanElement
}

/**
* Loads game stats: team name, votes, robot count
* We make the distinction between:
*    1) Team names - a global string identifier i.e. "Teh Devs"
*    2) Team IDs - each Battlecode team has a unique numeric team ID i.e. 0
*    3) In-game ID - used to distinguish teams in the current match only;
*       team 1 is red, team 2 is blue
*/
export default class Stats {

  readonly div: HTMLDivElement;
  private readonly images: AllImages;

  private readonly tourIndexJump: HTMLInputElement;

  private teamNameNodes: HTMLSpanElement[] = [];

  // Key is the team ID
  private robotImages: Map<string, Array<HTMLImageElement>> = new Map(); // the robot image elements in the unit statistics display 
  private robotTds: Map<number, Map<string, Map<number, HTMLTableCellElement>>> = new Map();

  private voteBars: VoteBar[];
  private maxVotes: number;

  private incomeDisplays: IncomeDisplay[];

  private relativeBars: HTMLDivElement[];
  
  private buffDisplays: BuffDisplay[];
  
  private extraInfo: HTMLDivElement;
  
  private robotConsole: HTMLDivElement;
  
  private runner: Runner; //needed for file uploading in tournament mode
  
  private conf: Config;

  private tourneyUpload: HTMLDivElement;

  private incomeChart: Chart;

  private ECs: HTMLDivElement;
  
  private teamMapToTurnsIncomeSet: Map<number, Set<number>>;

  // Note: robot types and number of teams are currently fixed regardless of
  // match info. Keep in mind if we ever change these, or implement this less
  // statically.

  readonly robots: schema.BodyType[] = cst.bodyTypeList;

  constructor(conf: Config, images: AllImages, runner: Runner) {
    this.conf = conf;
    this.images = images;

    for (const robot in this.images.robots) {
      let robotImages: Array<HTMLImageElement> = this.images.robots[robot];
      this.robotImages[robot] = robotImages.map((image) => image.cloneNode() as HTMLImageElement);
    }
    
    this.div = document.createElement("div");
    this.tourIndexJump = document.createElement("input");
    this.runner = runner;

    let teamNames: Array<string> = ["?????", "?????"];
    let teamIDs: Array<number> = [1, 2];
    this.initializeGame(teamNames, teamIDs);
  }

  /**
   * Colored banner labeled with the given teamName
   */
  private teamHeaderNode(teamName: string, inGameID: number) {
    let teamHeader: HTMLDivElement = document.createElement("div");
    teamHeader.className += ' teamHeader';

    let teamNameNode = document.createElement('span');
    teamNameNode.innerHTML = teamName;
    teamHeader.style.backgroundColor = hex[inGameID];
    teamHeader.appendChild(teamNameNode);
    this.teamNameNodes[inGameID] = teamNameNode;
    return teamHeader;
  }

  /**
   * Create the table that displays the robot images along with their counts.
   * Uses the teamID to decide which color image to display.
   */
  private robotTable(teamID: number, inGameID: number): HTMLTableElement {
    let table: HTMLTableElement = document.createElement("table");
    table.setAttribute("align", "center");

    // Create the table row with the robot images
    let robotImages: HTMLTableRowElement = document.createElement("tr");
    robotImages.appendChild(document.createElement("td")); // blank header

    // Create the table row with the robot counts
    let robotCounts = {};

    for (let value in this.robotTds[teamID]) {
      robotCounts[value] = document.createElement("tr");
      const title = document.createElement("td");
      if (value === "conviction") title.innerHTML = "<b>C</b>";
      if (value === "influence") title.innerHTML = "<b>I</b>";
      robotCounts[value].appendChild(title);
    }

    for (let robot of this.robots) {
      let robotName: string = cst.bodyTypeToString(robot);
      let tdRobot: HTMLTableCellElement = document.createElement("td");
      tdRobot.className = "robotSpriteStats";
      tdRobot.style.height = "100px";
      tdRobot.style.width = "100px";

      const img: HTMLImageElement = this.robotImages[robotName][inGameID];
      img.style.width = "60%";
      img.style.height = "60%";

      tdRobot.appendChild(img);
      robotImages.appendChild(tdRobot);

      for (let value in this.robotTds[teamID]) {
        let tdCount: HTMLTableCellElement = this.robotTds[teamID][value][robot];
        robotCounts[value].appendChild(tdCount);
        if (robot === schema.BodyType.ENLIGHTENMENT_CENTER && value === "count") {
          tdCount.style.fontWeight = "bold";
          tdCount.style.fontSize = "18px";          
        }
      }
    }
    table.appendChild(robotImages);
    for (let value in this.robotTds[teamID]) {
      table.appendChild(robotCounts[value]);
    }

    return table;
  }

  private initVoteBars(teamIDs: Array<number>) {
    const voteBars: VoteBar[] = [];
    teamIDs.forEach((teamID: number) => {
      let votes = document.createElement("div");
      votes.className = "stat-bar";
      votes.style.backgroundColor = hex[teamID];
      let votesSpan = document.createElement("span");
      let bidSpan = document.createElement("span");
      votesSpan.innerHTML = "0";
      bidSpan.innerHTML = "0";
      // Store the stat bars
      voteBars[teamID] = {
        bar: votes,
        vote: votesSpan,
        bid: bidSpan
      };
    });
    return voteBars;
  }

  private getVoteBarElement(teamIDs: Array<number>): HTMLElement {
    const votesDiv = document.createElement('div');

    const box = document.createElement('div');
    box.className = "votes-box";

    const title = document.createElement('div');
    title.className = "stats-header";
    
    const bars = document.createElement('div');
    bars.id = "vote-bars";
    bars.appendChild(document.createElement('div'));

    const votes = document.createElement('div');
    votes.className = "votes-info";
    const bids = document.createElement('div');
    bids.className = "votes-info";

    title.innerHTML = "Voting";

    const votesTitle = document.createElement('div');
    votesTitle.innerHTML = "<b>Votes</b>";
    votes.appendChild(votesTitle);

    const bidsTitle = document.createElement('div');
    bidsTitle.innerHTML = "<b>Bid</b>";
    bids.appendChild(bidsTitle);

    // build table

    teamIDs.forEach((id: number) => {

      const vote = document.createElement('div');
      vote.appendChild(this.voteBars[id].vote);
      votes.appendChild(vote);

      const bid = document.createElement('div');
      bid.appendChild(this.voteBars[id].bid);
      bids.appendChild(bid);

      bars.appendChild(this.voteBars[id].bar);
    });

    votesDiv.appendChild(title);
    box.appendChild(bids);
    box.appendChild(votes);
    box.appendChild(bars);
    votesDiv.appendChild(box);
    return votesDiv;
  }

  private initRelativeBars(teamIDs: Array<number>) {
    const relativeBars: HTMLDivElement[] = [];
    teamIDs.forEach((id: number) => {
      const bar = document.createElement("div");
      bar.style.backgroundColor = hex[id];
      bar.style.width = `50%`;
      bar.className = "influence-bar";
      bar.innerText = "0";

      relativeBars[id] = bar;
    });
    return relativeBars;
  }

  private getRelativeBarsElement(teamIDs: Array<number>): HTMLElement {
    const div = document.createElement("div");
    div.setAttribute("align", "center");
    div.id = "relative-bars";

    const label = document.createElement('div');
    label.className = "stats-header";
    label.innerText = 'Total Influence';

    const frame = document.createElement("div");
    frame.style.width = "90%";

    teamIDs.forEach((id: number) => {
      frame.appendChild(this.relativeBars[id]);
    });

    div.appendChild(label);
    div.appendChild(frame);
    return div;
  }

  private initBuffDisplays(teamIDs: Array<number>) {
    const buffDisplays: BuffDisplay[] = [];
    teamIDs.forEach((id: number) => {
      const numBuffs = document.createElement("sup");
      const buff = document.createElement("span");
      numBuffs.style.color = hex[id];
      buff.style.color = hex[id];
      buff.style.fontWeight = "bold";
      numBuffs.textContent = "0";
      buff.textContent = "1.000";
      buffDisplays[id] = {numBuffs: numBuffs, buff: buff};
    });
    return buffDisplays;
  }
  private initIncomeDisplays(teamIDs: Array<number>) {
    const incomeDisplays: IncomeDisplay[] = [];
    teamIDs.forEach((id: number) => {
      const income = document.createElement("span");
      income.style.color = hex[id];
      income.style.fontWeight = "bold";
      income.textContent = "1";
      incomeDisplays[id] = {income: income};
    });
    return incomeDisplays;
  }

  private getBuffDisplaysElement(teamIDs: Array<number>): HTMLElement {
    const div = document.createElement("div");
    div.id = "buffs";

    const label = document.createElement('div');
    label.className = "stats-header";
    label.innerText = 'Buffs';
    div.appendChild(label);

    teamIDs.forEach((id: number) => {
      const buffDiv = document.createElement("div");
      buffDiv.className = "buff-div";
      // cell.appendChild(document.createTextNode("1.001"));
      // cell.appendChild(this.buffDisplays[id].numBuffs);
      // cell.appendChild(document.createTextNode(" = "));
      buffDiv.appendChild(this.buffDisplays[id].buff);
      div.appendChild(buffDiv);
    });

    return div;
  }

  private getIncomeDisplaysElement(teamIDs: Array<number>): HTMLElement {
    const table = document.createElement("table");
    table.id = "income-table";
    table.style.width = "100%";

    const title = document.createElement('td');
    title.colSpan = 2;
    const label = document.createElement('div');
    label.className = "stats-header";
    label.innerText = 'Total Income Per Turn';

    const row = document.createElement("tr");

    teamIDs.forEach((id: number) => {
      const cell = document.createElement("td");
      // cell.appendChild(document.createTextNode("1.001"));
      // cell.appendChild(this.buffDisplays[id].numBuffs);
      // cell.appendChild(document.createTextNode(" = "));
      cell.appendChild(this.incomeDisplays[id].income);
      row.appendChild(cell);
    });

    title.appendChild(label);
    table.appendChild(title);
    table.appendChild(row);

    return table;
  }

  private getIncomeDominationGraph() {
    const canvas = document.createElement("canvas");
    canvas.id = "myChart";
    return canvas;
  }

  private getECDivElement() {
    const div = document.createElement('div');
    const label = document.createElement('div');
    label.className = "stats-header";
    label.innerText = 'EC Control';
    div.appendChild(label);
    div.appendChild(this.ECs);
    return div;
  }

  // private drawBuffsGraph(ctx: CanvasRenderingContext2D, upto: number) {
  //   ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  //   // draw axes
  //   ctx.save();
  //   ctx.strokeStyle = "#000000";
  //   ctx.lineWidth = 0.02;
  //   ctx.moveTo(0, 1);
  //   ctx.lineTo(0, 0);
  //   ctx.stroke();
  //   ctx.moveTo(0, 1);
  //   ctx.lineTo(1, 1);
  //   ctx.stroke();

  //   const xscale = 1 / upto;
  //   const yscale = 1 / cst.buffFactor(upto);

  //   for (let i = 0; i <= upto; i++) {
  //     ctx.moveTo(i * xscale, 1 - cst.buffFactor(i) * yscale);
  //     ctx.lineTo(i * xscale, 1 - cst.buffFactor(i + 1) * yscale);
  //   }
  //   ctx.stroke();

  //   ctx.restore();
  // }

  // private plotBuff(ctx: CanvasRenderingContext2D, upto: number, buff1: number, buff2: number) {
  //   const xscale = 1 / upto;
  //   const yscale = 1 / cst.buffFactor(upto);

  //   ctx.save();

  //   ctx.fillStyle = hex[1];
  //   ctx.font = "0.1px Comic Sans MS";
  //   //  ctx.moveTo(buff1*xscale, cst.buffFactor(buff1)*yscale);
  //   ctx.fillText("R", buff1 * xscale, 1 - cst.buffFactor(buff1) * yscale + 0.08);
  //   // ctx.arc(buff1*xscale, cst.buffFactor(buff1)*yscale, 0.02, 0, 2*Math.PI);
  //   // ctx.fill();

  //   ctx.fillStyle = hex[2];
  //   ctx.fillText("B", buff2 * xscale, 1 - cst.buffFactor(buff2) * yscale - 0.04);

  //   ctx.moveTo(buff2 * xscale, cst.buffFactor(buff2) * yscale - 0.05);
  //   // ctx.arc(buff1*xscale, cst.buffFactor(buff2)*yscale - 0.05, 0.02, 0, 2*Math.PI);
  //   // ctx.fill();
  //   ctx.restore();
  // }

  /**
   * Clear the current stats bar and reinitialize it with the given teams.
   */
  initializeGame(teamNames: Array<string>, teamIDs: Array<number>) {
    // Remove the previous match info
    while (this.div.firstChild) {
      this.div.removeChild(this.div.firstChild);
    }
    this.voteBars = [];
    this.relativeBars = [];
    this.maxVotes = 750;
    this.teamMapToTurnsIncomeSet = new Map();

    this.div.appendChild(document.createElement("br"));
    if (this.conf.tournamentMode) {
      // FOR TOURNAMENT
      this.tourneyUpload = document.createElement('div');
      
      let uploadButton = this.runner.getUploadButton();
      let tempdiv = document.createElement("div");
      tempdiv.className = "upload-button-div";
      tempdiv.appendChild(uploadButton);
      this.tourneyUpload.appendChild(tempdiv);

      // add text input field
      this.tourIndexJump.type = "text";
      this.tourIndexJump.onkeyup = (e) => { this.tourIndexJumpFun(e) };
      this.tourIndexJump.onchange = (e) => { this.tourIndexJumpFun(e) };
      this.tourneyUpload.appendChild(this.tourIndexJump);

      this.div.appendChild(this.tourneyUpload);
    }

    this.extraInfo = document.createElement('div');
    this.extraInfo.className = "extra-info";
    this.div.appendChild(this.extraInfo);

    // Populate with new info
    // Add a section to the stats bar for each team in the match
    for (var index = 0; index < teamIDs.length; index++) {
      // Collect identifying information
      let teamID = teamIDs[index];
      let teamName = teamNames[index];
      let inGameID = index + 1; // teams start at index 1
      this.robotTds[teamID] = new Map();

      // A div element containing all stats information about this team
      let teamDiv = document.createElement("div");

      // Create td elements for the robot counts and store them in robotTds
      // so we can update these robot counts later; maps robot type to count
      for (let value of ["count", "conviction", "influence"]) {
        this.robotTds[teamID][value] = new Map<number, HTMLTableCellElement>();
        for (let robot of this.robots) {
          let td: HTMLTableCellElement = document.createElement("td");
          td.innerHTML = "0";
          this.robotTds[teamID][value][robot] = td;
        }
      }

      // Add the team name banner and the robot count table
      teamDiv.appendChild(this.teamHeaderNode(teamName, inGameID));
      teamDiv.appendChild(this.robotTable(teamID, inGameID));

      this.div.appendChild(teamDiv);
    }

    this.div.appendChild(document.createElement("hr"));

    // Add stats table
    this.voteBars = this.initVoteBars(teamIDs);
    const voteBarsElement = this.getVoteBarElement(teamIDs);
    this.div.appendChild(voteBarsElement);

    this.relativeBars = this.initRelativeBars(teamIDs);
    const relativeBarsElement = this.getRelativeBarsElement(teamIDs);
    this.div.appendChild(relativeBarsElement);

    this.buffDisplays = this.initBuffDisplays(teamIDs);
    const buffDivsElement = this.getBuffDisplaysElement(teamIDs);
    this.div.appendChild(buffDivsElement);

    this.incomeDisplays = this.initIncomeDisplays(teamIDs);
    const incomeElement = this.getIncomeDisplaysElement(teamIDs);
    this.div.appendChild(incomeElement);

    const canvasElement = this.getIncomeDominationGraph();
    this.div.appendChild(canvasElement);
    this.incomeChart = new Chart(canvasElement, {
      type: 'line',
      data: {
          datasets: [{
            label: 'Red',
            data: [],
            backgroundColor: 'rgba(255, 99, 132, 0)',
            borderColor: 'rgb(219, 54, 39)',
            pointRadius: 0,
          },
          {
            label: 'Blue',
            data: [],
            backgroundColor: 'rgba(54, 162, 235, 0)',
            borderColor: 'rgb(79, 126, 230)',
            pointRadius: 0,
          }]
      },
      options: {
          aspectRatio: 1.5,
          scales: {
            xAxes: [{
              type: 'linear',
              ticks: {
                beginAtZero: true
            },
              scaleLabel: {
                display: true,
                labelString: "Turn"
              }
            }],
              yAxes: [{
                type: 'linear',
                  ticks: {
                      beginAtZero: true
                  }
              }]
          }
      }
    });

    this.ECs = document.createElement("div");
    this.ECs.style.height = "100px";
    this.ECs.style.display = "flex";
    this.div.appendChild(this.getECDivElement());

    this.div.appendChild(document.createElement("br"));
  }

  tourIndexJumpFun(e) {
    if (e.keyCode === 13) {
      var h = +this.tourIndexJump.value.trim().toLowerCase();
      this.runner.seekTournament(h - 1);
    }
  }

  /**
   * Change the robot count on the stats bar
   */
  setRobotCount(teamID: number, robotType: schema.BodyType, count: number) {
    let td: HTMLTableCellElement = this.robotTds[teamID]["count"][robotType];
    td.innerHTML = String(count);
  }

  /**
   * Change the robot conviction on the stats bar
   */
  setRobotConviction(teamID: number, robotType: schema.BodyType, conviction: number, totalConviction: number) {
    let td: HTMLTableCellElement = this.robotTds[teamID]["conviction"][robotType];
    td.innerHTML = String(conviction);

    const robotName: string = cst.bodyTypeToString(robotType);
    let img = this.robotImages[robotName][teamID];

    const size = (55 + 45 * conviction / totalConviction);
    img.style.width = size + "%";
    img.style.height = size + "%";
  }

  /**
   * Change the robot influence on the stats bar
   */
  setRobotInfluence(teamID: number, robotType: schema.BodyType, influence: number) {
    let td: HTMLTableCellElement = this.robotTds[teamID]["influence"][robotType];
    td.innerHTML = String(influence);
  }

  /**
   * Change the votes of the given team
   */
  setVotes(teamID: number, count: number) {
    // TODO: figure out if statbars.get(id) can actually be null??
    const statBar: VoteBar = this.voteBars[teamID];
    statBar.vote.innerText = String(count);
    this.maxVotes = Math.max(this.maxVotes, count);
    statBar.bar.style.width = `${Math.min(100 * count / this.maxVotes, 100)}%`;

    // TODO add reactions to relative bars
    // TODO get total votes to get ratio
    // this.relBars[teamID].width;

    // TODO winner gets star?
    // if (this.images.star.parentNode === statBar.bar) {
    //   this.images.star.remove();
    // }
  }

  setTeamInfluence(teamID: number, influence: number, totalInfluence: number) {
    const relBar: HTMLDivElement = this.relativeBars[teamID];
    relBar.innerText = String(influence);
    if (totalInfluence == 0) relBar.style.width = '50%';
    else relBar.style.width = String(Math.round(influence * 100 / totalInfluence)) + "%";
  }

  setBuffs(teamID: number, numBuffs: number) {
    //this.buffDisplays[teamID].numBuffs.textContent = String(numBuffs);
    this.buffDisplays[teamID].buff.textContent = String(cst.buffFactor(numBuffs).toFixed(3));
    this.buffDisplays[teamID].buff.style.fontSize = 14 * Math.sqrt(Math.min(9, cst.buffFactor(numBuffs))) + "px";
  }

  setIncome(teamID: number, income: number, turn: number) {
    this.incomeDisplays[teamID].income.textContent = String(income);
    if (!this.teamMapToTurnsIncomeSet.has(teamID)) {
      this.teamMapToTurnsIncomeSet.set(teamID, new Set());
    }
    let teamTurnsIncomeSet = this.teamMapToTurnsIncomeSet.get(teamID);
    
    if (!teamTurnsIncomeSet!.has(turn)) {
      //@ts-ignore
      this.incomeChart.data.datasets![teamID - 1].data?.push({y:income, x: turn});
      this.incomeChart.data.datasets?.forEach((d) => {
        d.data?.sort((a, b) => a.x - b.x);
      });
      teamTurnsIncomeSet?.add(turn);
      this.incomeChart.update();
    }
  }

  setWinner(teamID: number, teamNames: Array<string>, teamIDs: Array<number>) {
    const name = teamNames[teamIDs.indexOf(teamID)];
    this.teamNameNodes[teamID].innerHTML  = "<b>" + name + "</b> " +  `<span style="color: yellow">&#x1f31f</span>`;
  }

  setBid(teamID: number, bid: number) {
    // TODO: figure out if statbars.get(id) can actually be null??
    const statBar: VoteBar = this.voteBars[teamID];
    statBar.bid.innerText = String(bid);
    // TODO add reactions to relative bars
    // TODO get total votes to get ratio
    // this.relBars[teamID].width;

    // TODO winner gets star?
    // if (this.images.star.parentNode === statBar.bar) {
    //   this.images.star.remove();
    // }
  }

  setExtraInfo(info: string) {
    this.extraInfo.innerHTML = info;
  }

  hideTourneyUpload() {
    console.log(this.tourneyUpload);
    this.tourneyUpload.style.display = this.tourneyUpload.style.display === "none" ? "" : "none";
  }

  resetECs() {
    // while (this.ECs.lastChild) this.ECs.removeChild(this.ECs.lastChild);
    // console.log(this.ECs);
    this.ECs.innerHTML = "";
  }

  addEC(teamID: number) {
    const div = document.createElement("div");
    div.style.width = "35px";
    div.style.height = "35px";
    const img = this.images.robots["enlightenmentCenter"][teamID].cloneNode() as HTMLImageElement;
    img.style.width = "64px";
    img.style.height = "64px"; // update dynamically later
    div.appendChild(img);
    this.ECs.appendChild(div);
  }
}
