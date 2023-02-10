import { serverProperties } from "bdsx/serverproperties";

if (serverProperties["server-authoritative-movement"] !== "client-auth") {
    throw new Error("CIF는 client-auth 를 필요로 합니다.");
};

import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { CANCEL } from "bdsx/common";
import { CommandPermissionLevel } from "bdsx/bds/command";

import { announce_CIF, ban_CIF, detect_CIF, ipDetect_CIF, log_CIF } from "./functions";

import "./scripts";


export namespace CIF {

    /**
     * Send messages to players
     * @param message 보낼 메세지
     * @param target Permission
     */
    export function announce(message: string, target: CommandPermissionLevel | "ALL" = CommandPermissionLevel.Operator): void {
        return announce_CIF(message, target);
    };


    /**
    * 콘솔에 로그를 남깁니다
    * @param message 콘솔에 남길 문자
    */
    export function log(message: string): void {
        return log_CIF(message);
    };


    /**
     * 대충 밴 함수
     * @deprecated just define
     */
    export function ban(ni: NetworkIdentifier, reason: string): void {
        return ban_CIF(ni, reason);
    };


    /**
     * 대충 핵 감지됐을 때 쓰는 함수
     * @description CIF.ban() 은 이 함수에서 호출 안 함
     */
    export function detect(ni: NetworkIdentifier, cheatName: string, cheatDescription: string): CANCEL {
        return detect_CIF(ni, cheatName, cheatDescription);
    };


    /**
     * CVE 감지 때 쓰는 함수
     * @description CIF.ban() 은 이 함수에서 호출 안 함
     */
    export function ipDetect(ni: NetworkIdentifier, cheatName: string, cheatDescription: string): void {
        return ipDetect_CIF(ni, cheatName, cheatDescription);
    };


    export const wasDetected: Record<string, boolean> = {};
};