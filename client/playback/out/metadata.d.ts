import { schema } from 'battlecode-schema';
export declare const UNKNOWN_SPEC_VERSION = "UNKNOWN SPEC";
export declare const UNKNOWN_TEAM = "UNKNOWN TEAM";
export declare const UNKNOWN_PACKAGE = "UNKNOWN PACKAGE";
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
    types: {
        [key: number]: BodyTypeMetaData;
    };
    /**
     * All the teams in a game.
     */
    teams: {
        [key: number]: Team;
    };
    constructor();
    parse(header: schema.GameHeader): Metadata;
}
export declare class Team {
    name: string;
    packageName: string;
    teamID: number;
    constructor(teamID: number, packageName: string, name: string);
}
/**
 * Information about a specific body type.
 */
export declare class BodyTypeMetaData {
    type: schema.BodyType;
    spawnSource: schema.BodyType;
    cost: number;
    conviction: number;
    power: number;
    actionCooldown: number;
    visionRadiusSquared: number;
    actionRadiusSquared: number;
    bytecodeLimit: number;
    constructor(type: schema.BodyType, spawnSource: schema.BodyType, cost: number, conviction: number, power: number, actionCooldown: number, visionRadiusSquared: number, actionRadiusSquared: number, bytecodeLimit: number);
}
