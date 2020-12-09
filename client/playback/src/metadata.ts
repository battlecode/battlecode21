import {schema} from 'battlecode-schema';

export const UNKNOWN_SPEC_VERSION = "UNKNOWN SPEC";
export const UNKNOWN_TEAM = "UNKNOWN TEAM";
export const UNKNOWN_PACKAGE = "UNKNOWN PACKAGE";

/**
 * Metadata about a game.
 */
export default class Metadata {

  /**
   * The version of the spec this game complies with.
   */
  specVersion: string;

  /**
   * All the body types in a game.
   * Access like: meta.types[schema.BodyType.MINOR].strideRadius
   */
  types: {[key: number]: BodyTypeMetaData};

  /**
   * All the teams in a game.
   */
  teams: {[key: number]: Team};

  constructor() {
    this.specVersion = UNKNOWN_SPEC_VERSION;
    this.types = Object.create(null);
    this.teams = Object.create(null);
  }

  parse(header: schema.GameHeader): Metadata {
    this.specVersion = header.specVersion() as string || UNKNOWN_SPEC_VERSION;
    const teamCount = header.teamsLength();
    for (let i = 0; i < teamCount; i++) {
      const team = header.teams(i);
      this.teams[team.teamID()] = new Team(
        team.teamID(),
        team.packageName() as string || UNKNOWN_PACKAGE,
        team.name() as string || UNKNOWN_TEAM
      );
    }
    const bodyCount = header.bodyTypeMetadataLength();
    for (let i = 0; i < bodyCount; i++) {
      const body = header.bodyTypeMetadata(i);
      this.types[body.type()] = new BodyTypeMetaData(
        body.type(),
        body.spawnSource(),
        body.cost(),
        body.conviction(),
        body.power(),
        body.actionCooldown(),
        body.visionRange(),
        body.actionRange(),
        10000
      );
    }
    // SAFE
    Object.freeze(this.types);
    Object.freeze(this.teams);
    Object.freeze(this);
    return this
  }
}

export class Team {
  // schema.TeamData

  /// The name of the team.
  name: string;
  /// The java package the team uses.
  packageName: string;
  /// The ID of the team this data pertains to.
  teamID: number;

  constructor(teamID: number, packageName: string, name: string) {
    this.teamID = teamID;
    this.packageName = packageName;
    this.name = name;
    Object.freeze(this);
  }
}

/**
 * Information about a specific body type.
 */
export class BodyTypeMetaData {
  // schema.BodyTypeMetadata

  type: schema.BodyType;
  spawnSource: schema.BodyType;
  cost: number;
  conviction: number;
  power: number;
  actionCooldown: number;
  visionRadiusSquared: number;
  actionRadiusSquared: number;
  bytecodeLimit: number; // TODO: is this needed?
  
  constructor(type: schema.BodyType, spawnSource: schema.BodyType, cost: number,
      conviction: number, power: number, actionCooldown: number,
      visionRadiusSquared: number, actionRadiusSquared: number, bytecodeLimit: number) {

    this.type = type;
    this.spawnSource = spawnSource;
    this.cost = cost;
    this.conviction = conviction;
    this.power = power;
    this.actionCooldown = actionCooldown;
    this.visionRadiusSquared = visionRadiusSquared;
    this.actionRadiusSquared = actionRadiusSquared;
    this.bytecodeLimit = bytecodeLimit;
    Object.freeze(this);
  }
}
