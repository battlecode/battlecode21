import {Config} from '../config';
//import {Tournament, TournamentMatch} from './tournament_new';

/**
 * The splash screen for tournaments. Appears between every match
 * to show which two teams are coming up in which round.
 */
export default class Splash {

  private static screen: HTMLDivElement = document.createElement("div");
  private static container: HTMLDivElement = document.createElement("div");
  private static loaded: boolean = false;

  // Containers
  private static header: HTMLDivElement = document.createElement("div");
  private static subHeader: HTMLDivElement = document.createElement("div");
  private static team1Div: HTMLDivElement = document.createElement("div");
  private static team2Div: HTMLDivElement = document.createElement("div");
  private static versusDiv: HTMLDivElement = document.createElement("div");

  // Team elements to modify every time we change the screen
  private static avatarA: HTMLImageElement = document.createElement("img");
  private static avatarB: HTMLImageElement = document.createElement("img");
  private static nameAndIDA: HTMLSpanElement = document.createElement("span");
  private static nameAndIDB: HTMLSpanElement = document.createElement("span");

  // HACKS
  private static winnerScreen: HTMLDivElement = document.createElement("div");
  private static winnerContainer: HTMLDivElement = document.createElement("div");
  private static winnerLoaded: boolean = false;

  private static winnerHeader: HTMLDivElement = document.createElement("div");
  private static winnerAvatar: HTMLImageElement = document.createElement("img");
  private static winnerExtra: HTMLDivElement = document.createElement("div");

  /**
   * Loads the HTML structure of the screen just once.
   * Modifies the team elements directly after that.
   */
  private static loadScreen(): void {
    if (!Splash.loaded) {
      Splash.screen.className = "blackout";
      Splash.container.className = "blackout-container";

      // Bracket string
      Splash.header.className = "tournament-header";
      Splash.subHeader.className = "tournament-subheader";

      // Team A information (red)
      Splash.team1Div.id = "team1";
      Splash.team1Div.appendChild(Splash.nameAndIDA);

      // Center column (vs.)
      Splash.versusDiv.id = "versus";
      Splash.versusDiv.appendChild(document.createTextNode("versus"));

      // Team B information (blue)
      Splash.team2Div.id = "team2";
      Splash.team2Div.appendChild(Splash.nameAndIDB);

      // Put everything together
      Splash.container.appendChild(Splash.header);
      Splash.container.appendChild(Splash.subHeader);
      Splash.container.appendChild(document.createElement("br"));
      Splash.container.appendChild(Splash.team1Div);
      Splash.container.appendChild(Splash.versusDiv);
      Splash.container.appendChild(Splash.team2Div);

      Splash.screen.appendChild(Splash.container);
      Splash.loaded = true;
    }
  }

  /**
   * Loads the HTML structure of the screen just once.
   * Modifies the team elements directly after that.
   */
  private static loadWinnerScreen(): void {
    if (!Splash.winnerLoaded) {
      Splash.winnerScreen.className = "blackout";
      Splash.winnerContainer.className = "blackout-container";

      // Put everything together'\
      Splash.winnerHeader.id = "winner";
      Splash.winnerContainer.appendChild(Splash.winnerHeader);
      // Splash.winnerContainer.appendChild(document.createElement("br"));
      // Splash.winnerContainer.appendChild(Splash.winnerAvatar);
      // Splash.winnerContainer.appendChild(document.createElement('br'));
      // Splash.winnerContainer.appendChild(Splash.winnerExtra);

      Splash.winnerScreen.appendChild(Splash.winnerContainer);
      Splash.winnerLoaded = true;
    }
  }

  static addScreen(conf: Config, root: HTMLElement, team1: string, team2: string): void {
    this.loadScreen();

  //  this.header.innerText = 'Round 1';//this.getBracketString(tournament);
    // this.subHeader.innerText = `Game ${tournament.gameIndex+1} of ${tournament.roundLengths[tournament.roundIndex]}`;

   // this.avatarA.src = tournament.getAvatar(match.team1_name);
    this.nameAndIDA.innerText = team1;
   // this.avatarB.src = tournament.getAvatar(match.team2_name);
    this.nameAndIDB.innerText = team2;

    root.appendChild(this.screen)
  }

  static addWinnerScreen(conf: Config, root: HTMLElement, text: string) {
    this.loadWinnerScreen();

    this.winnerHeader.innerText = text;
    this.winnerHeader.className = "tournament-header";
 //  this.winnerAvatar.className = "big-avatar";
   // this.winnerAvatar.src = tournament.getAvatar(match.winner_name);
    root.appendChild(this.winnerScreen);
  }

  static removeScreen() {
    Splash.screen.remove();
    Splash.winnerScreen.remove();
  }
}

window['Splash'] = Splash;
