import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { CANCEL } from "bdsx/common";
import { bedrockServer } from "bdsx/launcher";
import { serverProperties } from "bdsx/serverproperties";

import { nameMap, deviceModelMap } from "./scripts/join";

if (serverProperties["server-authoritative-movement"] !== "client-auth") {
    throw new Error("CIF는 client-auth 를 필요로 합니다.");
};

/**
 * @deprecated 다른 곳에서 임의로 쓰지 마세요
 */
function zero(num: any, n: any) {
    let zero = "";
    let num2 = num.toString();
    if (num2.length < n) {
        for (var i = 0; i < n - num2.length; i++)
            zero += "0";
    }
    return zero + num;
};


/**
 * Date With Zero
 */
function dateWithZero() {
    var d = new Date();
    return (d.getFullYear() + "-" + zero((d.getMonth() + 1), 2) + "-"
        + zero(d.getDate(), 2) + ", " + zero(d.getHours(), 2) + "시 "
        + zero(d.getMinutes(), 2) + "분 " + zero(d.getSeconds(), 2) + "초 " + zero(d.getMilliseconds(), 3));
}

export namespace CIF {
    /**
     * 메세지 보냄
     * @param message 보낼 메세지
     */
    function announce(message: string, target: CommandPermissionLevel | "ALL" = CommandPermissionLevel.Operator) {
        let users;
        if (target === "ALL") {
            users = bedrockServer.serverInstance.getPlayers();
        } else {
            users = bedrockServer.serverInstance.getPlayers().filter(p => p.getCommandPermissionLevel() === target);
        }
        for (const member of users) {
            member.sendMessage(message);
        }
    }
    /**
    * 콘솔에 로그를 남깁니다
    * @param message 콘솔에 남길 문자
    */
    export function log(message: string): void {
        const date = new Date(); console.info("[" + date.getFullYear() + "-" + zero((date.getMonth() + 1), 2) + "-" + zero(date.getDate(), 2) + " " + zero(date.getHours(), 2) + ":" + zero(date.getMinutes(), 2) + ":" + zero(date.getSeconds(), 2) + ":" + zero(date.getMilliseconds(), 3) + " INFO] " + " [CIF] ".red + message);
    };


    /**
     * 대충 밴 함수
     * @description 현재 밴 기능 수행 X
     */
    export function ban(
        ni: NetworkIdentifier,
        reason: string
    ): void {
        const cheaterName = nameMap.get(ni);
        announce(`§c§l[§fCIF§c] §c${cheaterName} §6was banned by using §c${reason}`, "ALL");
    }


    /**
     * 대충 핵 감지됐을 때 쓰는 함수
     * @description CIF.ban() 은 이 함수에서 호출 안 함
     */
    export function detect(
        ni: NetworkIdentifier,
        cheatName: string,
        CheatDescription: string
    ): CANCEL {
        const cheaterName = nameMap.get(ni);
        bedrockServer.serverInstance.disconnectClient(ni, `§l§f[§cCIF§f]\n§b${cheatName} Detected`);
        announce(`§c§l[§fCIF§c] §c${cheaterName} §6was disconnected by using §c${cheatName}§7(${CheatDescription})`);
        return CANCEL;
    };
    /**
     * CVE 감지 때 쓰는 함수
     * @description CIF.ban() 은 이 함수에서 호출 안 함
     */
    export function ipDetect(ni: NetworkIdentifier, cheatName: string, CheatDescription: string) {
        const ip = ni.getAddress();
        announce(`§c§l[§fCIF§c] §cIP:${ip} §6was disconnected by using §c${cheatName}§7(${CheatDescription})`);
        return CANCEL;
    }
};


import "./scripts"; import { CommandPermissionLevel } from "bdsx/bds/command";

