import { serverProperties } from "bdsx/serverproperties";

if (serverProperties["server-authoritative-movement"] !== "client-auth") {
    throw new Error("CIF는 client-auth 를 필요로 합니다.");
};

import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { CommandMessage, CommandPermissionLevel, PlayerCommandSelector } from "bdsx/bds/command";
import { CANCEL } from "bdsx/common";
import "./scripts";

function abstractFunction(): never {
    throw Error(`Failed to load "implements.ts"`);
};

export namespace CIF {
    /**
     * Send messages to players
     * @param message 보낼 메세지
     * @param target Permission
     */
    export function announce(message: string, target: CommandPermissionLevel | "ALL" = CommandPermissionLevel.Operator): void {
        abstractFunction();
    };


    /**
    * 콘솔에 로그를 남깁니다
    * @param message 콘솔에 남길 문자
    */
    export function log(message: string): void {
        abstractFunction();
    };


    /**
     * 대충 밴 함수
     * @deprecated just define
     */
    export function ban(ni: NetworkIdentifier, reason: string): void {
        abstractFunction();
    };


    /**
     * 대충 핵 감지됐을 때 쓰는 함수
     * @description CIF.ban() 은 이 함수에서 호출 안 함
     */
    export function detect(ni: NetworkIdentifier, cheatName: string, cheatDescription: string): CANCEL {
        abstractFunction();
    };


    /**
     * CVE 감지 때 쓰는 함수
     * @description CIF.ban() 은 이 함수에서 호출 안 함
     */
    export function ipDetect(ni: NetworkIdentifier, cheatName: string, cheatDescription: string): void {
        abstractFunction();
    };

    export function resetDetected(playerName: string): void {
        abstractFunction();
    };

    export const wasDetected: Record<string, boolean> = {};
};

import "./implements";
import { events } from "bdsx/event";
import { command } from "bdsx/command";
import { ServerPlayer } from "bdsx/bds/player";

//debug code
events.serverOpen.on(() => {
    const debugCommand = command.register('cif', '', CommandPermissionLevel.Operator);
    debugCommand.overload((param, origin, output) => {
        CIF.announce(param.message.getMessage(origin), param.target);
    }, {
        announce: command.enum("announce"),
        message: CommandMessage,
        target: [command.enum("target", CommandPermissionLevel), true]
    });
    debugCommand.overload((param, origin, output) => {
        CIF.log(param.message.getMessage(origin));
    }, {
        log: command.enum("log"),
        message: CommandMessage
    });
    debugCommand.overload((param, origin, output) => {
        let player: any = param.target.newResults(origin, ServerPlayer);
        if (player.length !== 1) return output.error("한명을 선택해주세요");
        player = player[0];
        CIF.ban(player.getNetworkIdentifier(), param.reason.getMessage(origin));
    }, {
        ban: command.enum("ban"),
        target: PlayerCommandSelector,
        reason: CommandMessage
    });
    debugCommand.overload((param, origin, output) => {
        let player: any = param.target.newResults(origin, ServerPlayer);
        if (player.length !== 1) return output.error("한명을 선택해주세요");
        player = player[0];
        CIF.detect(player.getNetworkIdentifier(), param.cheatName.getMessage(origin), param.cheatDescription.getMessage(origin));
    }, {
        detect: command.enum("detect"),
        target: PlayerCommandSelector,
        cheatName: CommandMessage,
        cheatDescription: CommandMessage
    });
});