import {Config} from '../config';
import {Tournament, TournamentGame, TournamentMatch} from './tournament';

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
  private static columnLeft: HTMLDivElement = document.createElement("div");
  private static columnRight: HTMLDivElement = document.createElement("div");
  private static columnCenter: HTMLDivElement = document.createElement("div");

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
      Splash.columnLeft.className = "column-left";
      Splash.columnLeft.appendChild(Splash.avatarA);
      Splash.avatarA.className = "avatar";
      Splash.columnLeft.appendChild(document.createElement("br"));
      Splash.columnLeft.appendChild(Splash.nameAndIDA);

      // Center column (vs.)
      Splash.columnCenter.className = "column-center";
      Splash.columnCenter.appendChild(document.createTextNode("vs."));

      // Team B information (blue)
      Splash.columnRight.className = "column-right";
      Splash.columnRight.appendChild(Splash.avatarB);
      Splash.avatarB.className = "avatar";
      Splash.columnRight.appendChild(document.createElement("br"));
      Splash.columnRight.appendChild(Splash.nameAndIDB);

      // Put everything together
      Splash.container.appendChild(Splash.header);
      Splash.container.appendChild(Splash.subHeader);
      Splash.container.appendChild(document.createElement("br"));
      Splash.container.appendChild(Splash.columnLeft);
      Splash.container.appendChild(Splash.columnCenter);
      Splash.container.appendChild(Splash.columnRight);

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

      // Put everything together
      Splash.winnerContainer.appendChild(Splash.winnerHeader);
      Splash.winnerContainer.appendChild(document.createElement("br"));
      Splash.winnerContainer.appendChild(Splash.winnerAvatar);
      Splash.winnerContainer.appendChild(document.createElement('br'));
      Splash.winnerContainer.appendChild(Splash.winnerExtra);

      Splash.winnerScreen.appendChild(Splash.winnerContainer);
      Splash.winnerLoaded = true;
    }
  }

  static addScreen(conf: Config, root: HTMLElement, game: TournamentGame, match: TournamentMatch, tournament: Tournament): void {
    this.loadScreen();

    this.header.innerText = match.description;//this.getBracketString(tournament);
    // this.subHeader.innerText = `Game ${tournament.gameIndex+1} of ${tournament.roundLengths[tournament.roundIndex]}`;

    this.avatarA.src = tournament.getAvatar(match.team1_name);
    this.nameAndIDA.innerText = `${match.team1_name} (#${match.team1_id})`;
    this.avatarB.src = tournament.getAvatar(match.team2_name);
    this.nameAndIDB.innerText = `${match.team2_name} (#${match.team2_id})`;

    root.appendChild(this.screen)
  }

  static addWinnerScreen(conf: Config, root: HTMLElement, tournament: Tournament, match: TournamentMatch) {
    this.loadWinnerScreen();

    this.winnerHeader.innerText = `${match.winner_name} (#${match.winner_id}) wins!`;
    this.winnerHeader.className = "tournament-header";
    this.winnerAvatar.className = "big-avatar";
    this.winnerAvatar.src = tournament.getAvatar(match.winner_name);
    root.appendChild(this.winnerScreen);
  }

  static removeScreen() {
    Splash.screen.remove();
    Splash.winnerScreen.remove();
  }
}

window['Splash'] = Splash;
