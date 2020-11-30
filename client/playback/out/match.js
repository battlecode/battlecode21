"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gameworld_1 = require("./gameworld");
const battlecode_schema_1 = require("battlecode-schema");
// Return a timestamp representing the _current time in ms, not necessarily from
// any particular epoch.
const timeMS = typeof window !== 'undefined' && window.performance && window.performance.now ?
    window.performance.now.bind(window.performance) : Date.now.bind(Date);
/**
 * A timeline of a match. Allows you to see what the state of the match was,
 * at any particular time.
 *
 * Call timeline.seek() to request the state of the world at a particular
 * time; then call timeline.compute() to allow the timeline to perform computations.
 *
 * Note that this API is a state machine: you call methods on it,
 * then call compute() to let it do its thing, and then inspect it
 * to see what its current state is.
 *
 * This is awkward, but less so than callbacks.
 */
class Match {
    /**
     * Create a Timeline.
     */
    constructor(header, meta) {
        this._current = new gameworld_1.default(meta);
        this._current.loadFromMatchHeader(header);
        this._farthest = this._current;
        this.snapshots = [];
        this.snapshotEvery = 64;
        this.snapshots.push(this._current.copy());
        this.deltas = new Array(1);
        this.logs = new Array(1);
        this.blockchain = new Array(1);
        this.profilerFiles = [];
        this.maxTurn = header.maxRounds();
        this._lastTurn = null;
        this._seekTo = 0;
        this._winner = null;
    }
    /**
     * The current game world.
     * DO NOT CACHE this reference between calls to seek() and compute(), it may
     * change.
     */
    get current() {
        return this._current;
    }
    /**
     * The round we're attempting to seek to.
     */
    get seekTo() { return this._seekTo; }
    /**
     * Whether we've arrived at the seek point.
     */
    get arrived() { return this._seekTo === this._current.turn; }
    /**
     * The last turn in the match.
     */
    get lastTurn() { return this._lastTurn; }
    /**
     * The ID of the winner of this match.
     */
    get winner() { return this._winner; }
    /**
     * Whether this match has fully loaded.
     */
    get finished() { return this._winner !== null; }
    /**
     * Store a schema.Round and the logs contained in it.
     */
    applyDelta(delta) {
        if (delta.roundID() !== this.deltas.length) {
            throw new Error(`Can't store Round ${delta.roundID()}. Next Round should be Round ${this.deltas.length}`);
        }
        this.deltas.push(delta);
        if (delta.logs()) {
            this.parseLogs(delta.roundID(), delta.logs(battlecode_schema_1.flatbuffers.Encoding.UTF16_STRING));
        }
        this.parseBlockchain(delta);
    }
    /**
     * parses blockchain broadcasts
     */
    parseBlockchain(delta) {
        let blockMessages = new Array();
        // lol the schema format for this is real weird
        // THIS IS THE HACKIEST SOLUTION MANKIND HAS EVER SEEN
        // another option is actually changing the schema, but we can't remove parts of it
        // so then we would need to add a new thing
        // which would (1) break old replays and (2) have twice as big new replays
        // sorry this is probably the best solution
        // DO NOT COPY THIS CODE FOR FUTURE USE. MODIFY!!!
        let j = 0;
        let messageStringLen = delta.broadcastedMessagesLength();
        for (let i = 0; i < delta.broadcastedMessagesCostsLength(); i++) {
            let messageCost = delta.broadcastedMessagesCosts(i);
            // console.log(messageCost);
            // let x = delta.broadcastedMessages(j, flatbuffers.Encoding.UTF16_STRING);
            // var offset = delta.bb!.__offset(delta.bb_pos, 42);
            // var h = delta.bb!.__vector(delta.bb_pos + offset)
            // console.log(h);
            // var k = delta.bb!.readInt32(h);
            // console.log(k);
            // console.log(delta.bb!.readInt32(h+4));
            // console.log(delta.bb!.readInt32(h+8));
            // console.log(delta.bb!.readInt32(h+12));
            // console.log(delta.bb!.readInt32(h+16));
            let thisTransaction = "";
            let offset = delta.bb.__offset(delta.bb_pos, 42);
            let startPointer = delta.bb.__vector(delta.bb_pos + offset);
            if (offset) {
                // this is ascii
                let x = String.fromCharCode(delta.bb.readInt32(startPointer + 4 * j));
                while (x !== ' ') {
                    // console.log(x);
                    // this will be 
                    thisTransaction += x;
                    j += 1;
                    if (j >= messageStringLen) {
                        console.log("BLOCKCHAIN ERROR SHOULD NEVER HAPPEN");
                        break;
                    }
                    x = String.fromCharCode(delta.bb.readInt32(startPointer + 4 * j));
                }
                j += 1;
                // now split this transaction on _
                let splitMessage = thisTransaction.split("_");
                let messageArr = new Array();
                for (let j = 0; j < splitMessage.length; j++) {
                    messageArr.push(parseInt(splitMessage[j]));
                }
                blockMessages.push({
                    cost: messageCost,
                    message: messageArr
                });
            }
            else {
                console.log("couldn't display blockchain");
            }
        }
        // console.log(blockMessages);
        // for (let i = 0; i < delta.broadcastedMessagesCostsLength(); i++) {
        // let messageString = delta.broadcastedMessages(i);
        // let messageCost = delta.broadcastedMessagesCosts(i);
        // console.log(messageString);
        // // string is formatted as int_int_int
        // let splitMessage = messageString.split("_");
        // let messageArr = new Array<number>();
        // for (let j = 0; j < splitMessage.length; j++) {
        //   messageArr.push(parseInt(splitMessage[j]));
        // }
        // blockMessages.push({
        //   cost: messageCost,
        //   message: messageArr
        // });
        // }
        this.blockchain.push({
            messages: blockMessages,
            round: delta.roundID()
        });
    }
    /**
     * Parse logs for a round.
     */
    parseLogs(round, logs) {
        // TODO regex this properly
        // Regex
        let lines = logs.split(/\r?\n/);
        let header = /^\[(A|B):(MINER|LANDSCAPER|DELIVERY_DRONE|NET_GUN|REFINERY|VAPORATOR|HQ|DESIGN_SCHOOL|FULFILLMENT_CENTER)#(\d+)@(\d+)\] (.*)/;
        let roundLogs = new Array();
        // Parse each line
        let index = 0;
        while (index < lines.length) {
            let line = lines[index];
            let matches = line.match(header);
            // Ignore empty string
            if (line === "") {
                index += 1;
                continue;
            }
            // The entire string and its 5 parenthesized substrings must be matched!
            if (matches === null || (matches && matches.length != 6)) {
                // throw new Error(`Wrong log format: ${line}`);
                console.log(`Wrong log format: ${line}`);
                console.log('Omitting logs');
                return;
            }
            let shortenRobot = new Map();
            shortenRobot.set("MINER", "M");
            shortenRobot.set("LANDSCAPER", "L");
            shortenRobot.set("DELIVERY_DRONE", "DD");
            shortenRobot.set("NET_GUN", "NG");
            shortenRobot.set("REFINERY", "R");
            shortenRobot.set("VAPORATOR", "V");
            shortenRobot.set("HQ", "HQ");
            shortenRobot.set("DESIGN_SCHOOL", "DS");
            shortenRobot.set("FULFILLMENT_CENTER", "FC");
            // Get the matches
            let team = matches[1];
            let robotType = matches[2];
            let id = parseInt(matches[3]);
            let logRound = parseInt(matches[4]);
            let text = new Array();
            let mText = "<span class='consolelogheader consolelogheader1'>[" + team + ":" + robotType + "#" + id + "@" + logRound + "]</span>";
            let mText2 = "<span class='consolelogheader consolelogheader2'>[" + team + ":" + shortenRobot.get(robotType) + "#" + id + "@" + logRound + "]</span> ";
            text.push(mText + mText2 + matches[5]);
            index += 1;
            // If there is additional non-header text in the following lines, add it
            while (index < lines.length && !lines[index].match(header)) {
                text.push(lines[index]);
                index += 1;
            }
            if (logRound != round) {
                console.warn(`Your computation got cut off while printing a log statement at round ${logRound}; the actual print happened at round ${round}`);
            }
            // Push the parsed log
            roundLogs.push({
                team: team,
                robotType: robotType,
                id: id,
                round: logRound,
                text: text.join('\n')
            });
        }
        this.logs.push(roundLogs);
    }
    /**
     * Finish the timeline.
     */
    applyFooter(footer) {
        if (footer.totalRounds() !== this.deltas.length - 1) {
            throw new Error(`Wrong total round count: is ${footer.totalRounds()}, should be ${this.deltas.length - 1}`);
        }
        this._lastTurn = footer.totalRounds();
        this._winner = footer.winner();
        for (let i = 0, iMax = footer.profilerFilesLength(); i < iMax; i++) {
            const file = footer.profilerFiles(i);
            const frames = [];
            for (let j = 0, jMax = file.framesLength(); j < jMax; j++) {
                frames.push(file.frames(j));
            }
            const profiles = [];
            for (let j = 0, jMax = file.profilesLength(); j < jMax; j++) {
                const profile = file.profiles(j);
                const events = [];
                for (let k = 0, kMax = profile.eventsLength(); k < kMax; k++) {
                    const event = profile.events(k);
                    events.push({
                        type: event.isOpen() ? 'O' : 'C',
                        at: event.at(),
                        frame: event.frame(),
                    });
                }
                profiles.push({
                    name: profile.name(),
                    events,
                });
            }
            this.profilerFiles.push({ frames, profiles });
        }
    }
    /**
     * Attempt to set seekTo to a particular point.
     * Return whether or not it is possible to seek to that round;
     * if we don't have deltas to it, we can't.
     * If we can, each call to compute() will update state until current.turn === seekTo
     */
    // TODO smoother reverse? (the timeline is shaky)
    seek(round) {
        // the last delta we have is this.deltas.length-1, which takes us to turn
        // this.deltas.length-1; if we're higher than that, we can't seek
        // this.deltas.length-1: the time when the game ends.
        // this._farthest.turn: the last time we processed so far
        // this._seekTo: the time we want to be in
        this._seekTo = Math.max(Math.min(this.deltas.length - 1, round), 0);
        if (this._seekTo >= this._farthest.turn) {
            // Go as far as we can
            this._current = this._farthest;
        }
        else {
            // Go to the closest round before seekTo
            const snap = this._seekTo - (this._seekTo % this.snapshotEvery);
            if (this._current.turn < snap || this._seekTo < this._current.turn) {
                this.current.copyFrom(this.snapshots[Math.floor(snap / this.snapshotEvery)]);
            }
        }
    }
    /**
     * Perform computations for some amount of time.
     * We try to overshoot timeGoal as little as possible; however, if turn applications start taking a long time, we may overshoot it arbitrarily far.
     * If timeGoal is 0, we'll compute until we're done.
     */
    compute(timeGoal = 5) {
        let start = timeMS();
        // Once we hit our soft limit, stop computing.
        while (timeGoal === 0 || timeMS() < start + timeGoal) {
            // This is coded as a state machine, which is somewhat confusing. Sorry.
            // We do one expensive operation (a turn application) every cycle round
            // the while loop.
            if (this._current.turn !== this._seekTo) {
                // Current is not at the seek-goal.
                // Walk it forward.
                this._processDelta(this._current);
                if (this._current.turn > this._farthest.turn) {
                    this._farthest = this._current;
                }
            }
            else {
                if (this._farthest.turn < this.deltas.length - 1) {
                    // Then, step our highest frame forward while we still have time, and rounds left to process
                    if (this._current === this._farthest) {
                        // make sure we don't update current when we don't want to
                        this._farthest = this._current.copy();
                    }
                    this._processDelta(this._farthest);
                }
                else {
                    break;
                }
            }
        }
    }
    /**
     * Apply a delta to a GameWorld, based on world.turn.
     * That is, go from world.turn to world.turn+1. In other words, this is computing the effects of world.turn+1.
     */
    _processDelta(world) {
        if (world.turn + 1 >= this.deltas.length) {
            throw new Error(`Can't process turn ${world.turn + 1}, only have up to ${this.deltas.length - 1}`);
        }
        world.processDelta(this.deltas[world.turn + 1]);
        // if this turn should be saved to snapshot, and if it is not saved already:
        if (world.turn % this.snapshotEvery === 0
            && this.snapshots[world.turn / this.snapshotEvery] === undefined) {
            this.snapshots[world.turn / this.snapshotEvery] = world.copy();
        }
    }
}
exports.default = Match;
