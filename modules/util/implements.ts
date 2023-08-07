import { CommandPermissionLevel } from "bdsx/bds/command";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { CANCEL } from "bdsx/common";
import { bedrockServer } from "bdsx/launcher";
import { CIF } from "../../main";
import { deviceIdMap, identityPublicKeyMap } from "../scripts/join";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { red } from "colors";


/**
 * @description 다른 곳에서 임의로 쓰지 마세요
 */
function zero(num: any, n: any) {
    let zero = "";
    let num2 = num.toString();
    if (num2.length < n) {
        for (var i = 0; i < n - num2.length; i++)
            zero += "0";
    };
    return zero + num;
};


/**
 * Date With Zero
 * @description Use for ban
 */
export function dateWithZero() {
    var d = new Date();
    return (d.getFullYear() + "-" + zero((d.getMonth() + 1), 2) + "-"
        + zero(d.getDate(), 2) + ", " + zero(d.getHours(), 2) + "시 "
        + zero(d.getMinutes(), 2) + "분 " + zero(d.getSeconds(), 2) + "초 " + zero(d.getMilliseconds(), 3));
};


CIF.announce = function (message: string, target: CommandPermissionLevel | "ALL" = CommandPermissionLevel.Operator): void {
    let users;
    if (target === "ALL") {
        users = bedrockServer.serverInstance.getPlayers();
    } else {
        users = bedrockServer.serverInstance.getPlayers().filter(p => p.getCommandPermissionLevel() === target);
    };

    for (const member of users) {
        if (this.wasDetected[member.getName()] === true) continue;
        member.sendMessage(`§c[§fCIF§c] ${message}`);
    };
};


CIF.log = function (message: string): void {
    const date = new Date();
    console.info(
        "[" + date.getFullYear() + "-" + zero((date.getMonth() + 1), 2) + "-" + zero(date.getDate(), 2) +
        " " + zero(date.getHours(), 2) + ":" + zero(date.getMinutes(), 2) + ":" + zero(date.getSeconds(), 2) +
        ":" + zero(date.getMilliseconds(), 3) + " INFO] " + "[CIF] ".red + message);
};


CIF.detect = function (ni: NetworkIdentifier, cheatName: string, cheatDescription: string): CANCEL {
    const cheaterName = ni.getActor()!.getName();
    this.wasDetected[cheaterName] = true;
    // if (MovementType === MinecraftPacketIds.PlayerAuthInput) {
    //     bedrockServer.serverInstance.disconnectClient(ni, `§l§f§c[§fCIF§c]\n§b${cheatName} §6detected`);
    // };

    this.announce(`§c${cheaterName} §6has been punished using §c${cheatName} §7(${cheatDescription})`);
    this.log(`${cheaterName} has been punished using ${cheatName} (${cheatDescription})`.bgYellow);
    return CANCEL;
};


CIF.ipDetect = function (ni: NetworkIdentifier, cheatName: string, cheatDescription: string): void {
    const ip = ni.getAddress().split("|")[0];
    this.announce(`§c${ip} §6has been ip-blocked using §c${cheatName} §7(${cheatDescription})`);
    this.log(`${ip} has been ip-blocked using ${cheatName} (${cheatDescription})`);
};


CIF.ban = function (ni: NetworkIdentifier, reason: string): void {
    const cheaterName = ni.getActor()!.getName();
    this.wasDetected[cheaterName] = true;
    this.announce(`§c${cheaterName} §6has been banned using §c${reason}`, "ALL");
    this.log(red(`${cheaterName} has been banned using ${reason}`));
    const did = deviceIdMap.get(ni)!;
    // if (did.length === 36) {
    // 	const accidKey = identityPublicKeyMap.get(ni)!;
    // 	writeFileSync("../CIFbanList/"+accidKey, cheaterName+":"+reason);
    // } else {
    writeFileSync("../CIFbanList/" + did, cheaterName + ":" + reason);
    //};
};


CIF.suspect = function (ni: NetworkIdentifier, cheatName: string, cheatDescription: string): CANCEL {
    const cheaterName = ni.getActor()!.getName();
    this.announce(`§c${cheaterName} §6has been suspected of using §c${cheatName} §7(${cheatDescription})`);
    this.log(`${cheaterName} has been suspected of using ${cheatName} (${cheatDescription})`.yellow);
    return CANCEL;
};


CIF.resetDetected = function (plname: string): void {
    this.wasDetected[plname] = false;
};


if (!existsSync("../CIFbanList")) {
    mkdirSync("../CIFbanList");
};