import {path, fs} from './electron-modules';

export function readTournament(jsonFile: File, cb: (err: Error | null, t: Tournament | null) => void) {
  /*if (!process.env.ELECTRON) {
    cb(new Error("Can't read tournaments outside of electron"), null);
    return;
  }*/

  const reader = new FileReader();
  reader.onload = () => {
    console.log('reader RESULT');
    console.log(reader.result);
    if (reader.error) {
      cb(reader.error, null);
      return;
    }
    
    var tournament;
    try {
      tournament = new Tournament(JSON.parse(<string>reader.result));
    } catch (e) {
      cb(e, null);
      return;
    }
    cb(null, tournament);
  };
  reader.readAsText(jsonFile);
}

// Use like a "cursor" into a tournament.
// It's a bit awkward.
export class Tournament {
  readonly dir: string;
  readonly desc: TournamentDesc;

  // cursors to games
  // this is the index within a game
  gameIndex: number;
  // cursor to match index
  matchIndex: number;

  readonly matches: number;
  readonly matchLengths: number[];

  constructor(desc: TournamentDesc) {
    this.dir = desc.tournamentDirectory;
    this.desc = desc;  
    this.matchIndex = 0;
    this.gameIndex = 0;
    this.matches = desc.matches.length;
    this.matchLengths = desc.matches.map((match) => match.games.length);
  }

  seek(matchIndex: number, gameIndex: number) {
    if (matchIndex < this.matches && gameIndex < this.matchLengths[matchIndex]) {
      this.matchIndex = matchIndex;
      this.gameIndex = gameIndex;
    } else {
      throw new Error("Out of bounds: "+matchIndex+","+gameIndex);
    }
  }

  hasNext(): boolean {
    return this.matchIndex < this.matches && this.gameIndex < this.matchLengths[this.matchIndex];
  }

  next() {
    if (!this.hasNext()) {
      throw new Error("No more games!");
    }
    this.gameIndex++;
    if (this.gameIndex >= this.matchLengths[this.matchIndex]) {
      this.gameIndex = 0;
      this.matchIndex++;
    }
  }

  getAvatar(name: string) {
    // convert the name into an ID
    // TODO: speed this up
    for (var i = 0; i < this.desc.teams.length; i++) {
      if (this.desc.teams[i].name === name) {
        return 'file://' + path.join(this.dir, this.desc.teams[i].avatarPath);
      }
    }
    return "not found :((";
  }

  isLastGameInMatch(): boolean {
    return this.gameIndex === this.matchLengths[this.matchIndex]-1;
  }
  isFirstGameInMatch(): boolean {
    return this.gameIndex === 0;
  }

  hasPrev(): boolean {
    return this.matchIndex > 0 || this.gameIndex > 0;
  }

  prev() {
    if (!this.hasPrev()) {
      throw new Error("No previous games!");
    }
    this.gameIndex--;
    if (this.gameIndex < 0) {
      this.matchIndex--;
      this.gameIndex = this.matchLengths[this.matchIndex]-1;
    }
  }

  current(): TournamentGame {
    if (this.matchIndex > this.matches || this.gameIndex > this.matchLengths[this.matchIndex]) {
      throw new Error(`BAD COMBO: match ${this.matchIndex}, ${this.gameIndex}`);
    }
    if (this.desc.matches[this.matchIndex] == undefined) {
      throw new Error("Undefined match?? "+this.matchIndex);
    }
    return this.desc.matches[this.matchIndex].games[this.gameIndex];
  }

  currentMatch(): TournamentMatch {
    if (this.matchIndex > this.matches) {
      throw new Error(`match out of bounds: ${this.matchIndex}`);
    }
    if (this.desc.matches[this.matchIndex] == undefined) {
      throw new Error("Undefined match?? "+this.matchIndex);
    }
    return this.desc.matches[this.matchIndex];
  }

  readCurrent(cb: (err: Error | null, match: ArrayBuffer | null) => void) {
    const current = this.current();
    fs.readFile(path.join(this.dir, current.match_file), (err, data) => {
      if (err) {
        cb(err, null);
        return;
      }

      cb(null, data.buffer);
    });
  }
}

export interface TournamentGame {
  /** unique (in tournament) game id */
  id: number,
  match_file: string, // relative path


  // winner_id: number, // ids are just easier
  // winner_name: string, // jkjk


  // cumulative score BEFORE this game
  // 1 is team 1 and 2 is team 2
  // where team 1 and team 2 is the same accross games in a match
  cumulativeWins1: number,
  cumulativeWins2: number

  // the game ids where the winner and loser came from
  // winner_from: number,
  // loser_from: number,
  // maps: string,

}

export interface TournamentMatch {
  name: string,
  games: [TournamentGame],
  // e.g. "round 1 (losers)"
  description: string,
  winner_id: number, // the grand winner
  winner_name: string,
  team1_id: number,
  team1_name: string,
  team2_id: number,
  team2_name: string
}

export interface TournamentTeams {
  seed: number,
  id: number, // this decides the IDs that are used, for e.g. avatars
  name: string,
  avatarPath: string, // relative to tournamentDirectory
}

export interface TournamentDesc {
  name: string,
  tournamentDirectory: string, // must be nonrelative path
  type: "single-elimination",
  teams: TournamentTeams[],
  matches: TournamentMatch[]
}
