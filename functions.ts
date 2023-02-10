import { CommandPermissionLevel } from "bdsx/bds/command";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { CANCEL } from "bdsx/common";
import { bedrockServer } from "bdsx/launcher";
import { CIF } from "./main";
import { nameMap } from "./scripts/join";


/**
 * @description 다른 곳에서 임의로 쓰지 마세요
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
 * @description Use for ban
 */
function dateWithZero() {
    var d = new Date();
    return (d.getFullYear() + "-" + zero((d.getMonth() + 1), 2) + "-"
        + zero(d.getDate(), 2) + ", " + zero(d.getHours(), 2) + "시 "
        + zero(d.getMinutes(), 2) + "분 " + zero(d.getSeconds(), 2) + "초 " + zero(d.getMilliseconds(), 3));
};


export function announce_CIF(message: string, target: CommandPermissionLevel | "ALL" = CommandPermissionLevel.Operator): void {
    let users;
    if (target === "ALL") {
        users = bedrockServer.serverInstance.getPlayers();
    } else {
        users = bedrockServer.serverInstance.getPlayers().filter(p => p.getCommandPermissionLevel() === target);
    };

    for (const member of users) {
        if (CIF.wasDetected[member.getNameTag()] === true) continue;
        member.sendMessage(message);
    };
};


export function log_CIF(message: string): void {
    const date = new Date();
    console.info(
        "[" + date.getFullYear() + "-" + zero((date.getMonth() + 1), 2) + "-" + zero(date.getDate(), 2) +
        " " + zero(date.getHours(), 2) + ":" + zero(date.getMinutes(), 2) + ":" + zero(date.getSeconds(), 2) + 
        ":" + zero(date.getMilliseconds(), 3) + " INFO] " + "[CIF] ".red + message);
};


export function detect_CIF(ni: NetworkIdentifier, cheatName: string, cheatDescription: string): CANCEL {
    const cheaterName = nameMap.get(ni)!;
    CIF.wasDetected[cheaterName] = true;
    // bedrockServer.serverInstance.disconnectClient(ni, `§l§f[§cCIF§f]\n§b${cheatName} Detected`);
    CIF.announce(`§c[§fCIF§c] §c${cheaterName} §6was blocked all-packets using §c${cheatName} §7(${cheatDescription})`);
    CIF.log(`${cheaterName} was blocked all-packets using ${cheatName} (${cheatDescription})`);
    return CANCEL;
};


export function ipDetect_CIF(ni: NetworkIdentifier, cheatName: string, cheatDescription: string): void {
    const ip = ni.getAddress().split("|")[0];
    CIF.announce(`§c[§fCIF§c] §c${ip} §6was ip-blocked using §c${cheatName} §7(${cheatDescription})`);
    CIF.log(`${ip} was ip-blocked using ${cheatName} (${cheatDescription})`);
};


export function ban_CIF (ni: NetworkIdentifier, reason: string): void {
    const cheaterName = nameMap.get(ni)!;
    CIF.wasDetected[cheaterName] = true;
    CIF.announce(`§c[§fCIF§c] §c${cheaterName} §6was banned using §c${reason}`, "ALL");
    CIF.log(`${cheaterName} was banned using ${reason}`);
};