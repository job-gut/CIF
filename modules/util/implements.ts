import { CommandPermissionLevel } from "bdsx/bds/command";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { bedrockServer } from "bdsx/launcher";
import { CIF } from "../../main";
import { deviceIdMap, identityPublicKeyMap, nameMap } from "../scripts/join";
import { MovementType } from "../scripts/movement";
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
        member.sendMessage(message);
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
    const cheaterName = nameMap.get(ni)!;
    this.wasDetected[cheaterName] = true;
    // if (MovementType === MinecraftPacketIds.PlayerAuthInput) {
    //     bedrockServer.serverInstance.disconnectClient(ni, `§l§f§c[§fCIF§c]\n§b${cheatName} §6detected`);
    // };

    this.announce(`§c[§fCIF§c] §c${cheaterName} §6was blocked all-packets using §c${cheatName} §7(${cheatDescription})`);
    this.log(`${cheaterName} was blocked all-packets using ${cheatName} (${cheatDescription})`.yellow);
    return CANCEL;
};


CIF.ipDetect = function (ni: NetworkIdentifier, cheatName: string, cheatDescription: string): void {
    const ip = ni.getAddress().split("|")[0];
    this.announce(`§c[§fCIF§c] §c${ip} §6was ip-blocked using §c${cheatName} §7(${cheatDescription})`);
    this.log(`${ip} was ip-blocked using ${cheatName} (${cheatDescription})`);
};


CIF.ban = function (ni: NetworkIdentifier, reason: string): void {
    const cheaterName = nameMap.get(ni)!;
    this.wasDetected[cheaterName] = true;
    this.announce(`§c[§fCIF§c] §c${cheaterName} §6was banned using §c${reason}`, "ALL");
    this.log(red(`${cheaterName} was banned using ${reason}`));
	const did = deviceIdMap.get(ni)!;
	// if (did.length === 36) {
	// 	const accidKey = identityPublicKeyMap.get(ni)!;
	// 	writeFileSync("../CIFbanList/"+accidKey, cheaterName+":"+reason);
	// } else {
		writeFileSync("../CIFbanList/"+did, cheaterName+":"+reason);
	//};
};


CIF.suspect = function (ni: NetworkIdentifier, cheatName: string, cheatDescription: string): CANCEL {
	const cheaterName = nameMap.get(ni)!;
	this.announce(`§c[§fCIF§c] §c${cheaterName} §6is suspected by §c${cheatName} §7(${cheatDescription})`);
	this.log(`${cheaterName} is suspected by ${cheatName} (${cheatDescription})`.yellow);
	return CANCEL;
};


CIF.resetDetected = function (plname: string): void {
    this.wasDetected[plname] = false;
};


if (!existsSync("../CIFbanList")) {
	mkdirSync("../CIFbanList");
};