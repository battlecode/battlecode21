"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNKNOWN_SPEC_VERSION = "UNKNOWN SPEC";
exports.UNKNOWN_TEAM = "UNKNOWN TEAM";
exports.UNKNOWN_PACKAGE = "UNKNOWN PACKAGE";
/**
 * Metadata about a game.
 */
class Metadata {
    constructor() {
        this.specVersion = exports.UNKNOWN_SPEC_VERSION;
        this.types = Object.create(null);
        this.teams = Object.create(null);
    }
    parse(header) {
        this.specVersion = header.specVersion() || exports.UNKNOWN_SPEC_VERSION;
        const teamCount = header.teamsLength();
        for (let i = 0; i < teamCount; i++) {
            const team = header.teams(i);
            this.teams[team.teamID()] = new Team(team.teamID(), team.packageName() || exports.UNKNOWN_PACKAGE, team.name() || exports.UNKNOWN_TEAM);
        }
        const bodyCount = header.bodyTypeMetadataLength();
        for (let i = 0; i < bodyCount; i++) {
            const body = header.bodyTypeMetadata(i);
            this.types[body.type()] = new BodyTypeMetaData(body.type(), body.spawnSource(), body.convictionRatio(), body.actionCooldown(), body.actionRadiusSquared(), body.sensorRadiusSquared(), body.detectionRadiusSquared(), body.bytecodeLimit());
        }
        // SAFE
        Object.freeze(this.types);
        Object.freeze(this.teams);
        Object.freeze(this);
        return this;
    }
}
exports.default = Metadata;
class Team {
    constructor(teamID, packageName, name) {
        this.teamID = teamID;
        this.packageName = packageName;
        this.name = name;
        Object.freeze(this);
    }
}
exports.Team = Team;
/**
 * Information about a specific body type.
 */
class BodyTypeMetaData {
    constructor(type, spawnSource, convictionRatio, actionCooldown, actionRadiusSquared, sensorRadiusSquared, detectionRadiusSquared, bytecodeLimit) {
        this.type = type;
        this.spawnSource = spawnSource;
        this.convictionRatio = convictionRatio;
        this.actionCooldown = actionCooldown;
        this.actionRadiusSquared = actionRadiusSquared;
        this.sensorRadiusSquared = sensorRadiusSquared;
        this.detectionRadiusSquared = detectionRadiusSquared;
        this.bytecodeLimit = bytecodeLimit;
    }
}
exports.BodyTypeMetaData = BodyTypeMetaData;
