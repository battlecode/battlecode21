import { path, fs } from './electron-modules';

export function readTournament(jsonFile: File, cbTournament: (t: Tournament) => void, cbError: (err: Error) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    console.log('reader RESULT');
    console.log(reader.result);
    if (reader.error) {
      cbError(reader.error);
      return;
    }

    try {
      const data: any[][] = JSON.parse(<string>reader.result);
      const parseMatch: (arr: [string, string, string, number, number]) => TournamentMatch = ((arr) => ({
        team1: arr[0],
        team2: arr[1],
        map: arr[2],
        winner: arr[3],
        url: "https://2021.battlecode.org/replays/" + arr[4] + ".bc21"
      }));
      const desc: TournamentMatch[][] = data.map((game) => (game.map(parseMatch)));
      const tournament = new Tournament(desc);
      cbTournament(tournament);
    } catch (e) {
      cbError(e);
      return;
    }
  };
  reader.readAsText(jsonFile);
}

// Use like a "cursor" into a tournament.
// It's a bit awkward.
export class Tournament {
  readonly games: TournamentMatch[][];
  // cursors to games
  // this is the index within a game
  matchI: number;
  // cursor to game index
  gameI: number;

  constructor(games: TournamentMatch[][]) {
    this.matchI = 0;
    this.gameI = 0;
    this.games = games;
  }

  seek(gameIndex: number, matchIndex: number) {
    if (gameIndex < this.games.length && matchIndex < this.games[gameIndex].length) {
      this.matchI = matchIndex;
      this.gameI = gameIndex;
    } else {
      throw new Error("Out of bounds: " + matchIndex + "," + gameIndex);
    }
  }

  hasNext(): boolean {
    return this.gameI < this.games.length - 1 || this.matchI < this.games[this.gameI].length - 1;
  }

  next() {
    if (!this.hasNext()) {
      throw new Error("No more matches!");
    }
    if (this.isLastMatchInGame()) {
      this.matchI = 0;
      this.gameI++;
    }
    else this.matchI++;
    console.log(`game index: ${this.gameI}\n match index: ${this.matchI}`);
  }

  // getAvatar(name: string) {
  //   // convert the name into an ID
  //   // TODO: speed this up
  //   for (var i = 0; i < this.desc.teams.length; i++) {
  //     if (this.desc.teams[i].name === name) {
  //       return 'file://' + path.join(this.dir, this.desc.teams[i].avatarPath);
  //     }
  //   }
  //   return "not found :((";
  // }

  isLastMatchInGame(): boolean {
    return this.matchI === this.games[this.gameI].length - 1 || (Math.abs(this.wins()[this.current().team1] - this.wins()[this.current().team2]) >= 2);
  }

  isFirstMatchInGame(): boolean {
    return this.matchI === 0;
  }

  hasPrev(): boolean {
    return this.matchI > 0 || this.gameI > 0;
  }

  prev() {
    if (!this.hasPrev()) {
      throw new Error("No previous matches!");
    }
    this.matchI--;
    if (this.matchI < 0) {
      this.gameI--;
      this.matchI = this.games[this.gameI].length - 1;
    }
    console.log(`game index: ${this.gameI}\n match index: ${this.matchI}`);
  }

  current(): TournamentMatch {
    if (this.gameI >= this.games.length || this.matchI >= this.games[this.gameI].length) {
      throw new Error(`BAD COMBO: match ${this.matchI}, ${this.gameI}`);
    }
    if (this.games[this.gameI][this.matchI] == undefined) {
      throw new Error("Undefined game?? " + this.matchI);
    }
    return this.games[this.gameI][this.matchI];
  }

  currentGame(): TournamentMatch[] {
    if (this.gameI > this.games.length) {
      throw new Error(`game out of bounds: ${this.gameI}`);
    }
    if (this.games[this.gameI] == undefined) {
      throw new Error("Undefined game?? " + this.matchI);
    }
    return this.games[this.gameI];
  }

  wins() {
    const team1 = this.current().team1;
    const team2 = this.current().team2;
    const wins = {};
    wins[team1] = 0;
    wins[team2] = 0;
    for (let matchI = 0; matchI <= this.matchI; matchI++) {
      const match = this.games[this.gameI][matchI];
      wins[match.winner == 1 ? match.team1 : match.team2]++;
    }
    return wins;
  }
}

export interface TournamentMatch {
  team1: string,
  team2: string,
  map: string,
  winner: number,
  url: string
}