import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { yellow } from "colors";
import { CIF } from "../../main";
import { CIFconfig } from "../util/configManager";
import { readFileSync, readdirSync } from "fs";
import { BuildPlatform } from "bdsx/common";
import { bedrockServer } from "bdsx/launcher";


export const nameMap = new Map<NetworkIdentifier, string>();

export const identityPublicKeyMap = new Map<NetworkIdentifier, string>();

export const deviceIdMap = new Map<NetworkIdentifier, string>();

export const wasJoinedIn15seconds = new Map<NetworkIdentifier, boolean>();


const firstLoginedDID: Record<string, string> = {};
const firstLoginedOS: Record<string, number> = {};


events.packetAfter(MinecraftPacketIds.Login).on((pkt, ni) => {

    const req = pkt.connreq;
    if (req === null) return;
    const deviceId = req.getDeviceId();
    const deviceOS = req.getDeviceOS();
    const cert = req.getCertificate();
    const name = cert.getId();
    const ip = ni.getAddress();
    const xuid = cert.getXuid();
    const model = req.getJsonValue()!.DeviceModel;
    const slashReg = /\//g;
    const publicIDKey = String(cert.json.value().identityPublicKey).replace(slashReg, "_");

    const isXboxLogined = xuid.length > 3;
    nameMap.set(ni, name);
    identityPublicKeyMap.set(ni, publicIDKey);
    wasJoinedIn15seconds.set(ni, true);
    deviceIdMap.set(ni, deviceId);

    setTimeout(() => {
        wasJoinedIn15seconds.set(ni, false);
    }, 15000);

    const banlist = readdirSync("../CIFbanList");
	let hasFilteredBannedPlayer = false;

    for (const bannedPlayer of banlist) {
        if (bannedPlayer === publicIDKey || bannedPlayer === deviceId) {
            const bannedReason = readFileSync("../CIFbanList/" + bannedPlayer).toString().split(":")[1];
            CIF.wasDetected[name] = true;
            bedrockServer.serverInstance.disconnectClient(ni, `§l§f§c[§fCIF§c]\n§cYou are banned by CIF\n§e(Auto Cheat Detection)`);
            CIF.announce(`§c${name} §6failed to connect §7(§c${bannedReason}§7)`);
            CIF.log(`${name} failed to connect ` + "(".white + `${bannedReason.red})`.yellow);

			hasFilteredBannedPlayer = true;
        };
    };

	if (!hasFilteredBannedPlayer) {
		for (const bannedPlayer of banlist) {
			const bannedName = readFileSync("../CIFbanList/" + bannedPlayer).toString().split(":")[0];

			if (bannedName === name) {
				const bannedReason = readFileSync("../CIFbanList/" + bannedPlayer).toString().split(":")[1];
				CIF.wasDetected[name] = true;
				bedrockServer.serverInstance.disconnectClient(ni, `§l§f§c[§fCIF§c]\n§cYou are banned by CIF\n§e(Auto Cheat Detection)`);
				CIF.announce(`§c${name} §6failed to connect §7(§c${bannedReason}§7)`);
				CIF.log(`${name} failed to connect ` + "(".white + `${bannedReason.red})`.yellow);
	
				hasFilteredBannedPlayer = true;
				break;
			};
		};
	};

    if (CIFconfig.Modules.join !== true) return;


    if (name.length > 20) {
        nameMap.set(ni, "Invalid_Name");
        CIF.detect(ni, "long_name", "Too long nickname");
        CIF.ban(ni, "Long_Name");
    };

    if (name === "") {
        nameMap.set(ni, "Invalid_Name");
        CIF.detect(ni, "invalid_name", "Nickname is null");
        CIF.ban(ni, "Invalid_Name");
    };

    const invisibleChars = ["⠀", " ", " ", " ", "　", " ", " ", " ", " ", "﻿", " ", " ", "󠀠", " ", " ", "​", " "];

    for (let i = 0; i < invisibleChars.length; i++) {
        const char = invisibleChars[i];
        if (name.includes(char)) {
            nameMap.set(ni, "Invalid_Name");
            CIF.detect(ni, "invisible_name", "Nickname includes disallowed space");
            CIF.ban(ni, "Invisible_Name");
        };
    };

    if (deviceId.length !== 32 && deviceId.length !== 36) {
        CIF.detect(ni, "Invalid DeviceID", "Spoof their DeviceId");
        CIF.ban(ni, "Invalid-DeviceId");
    };

    const brand = model.split(" ")[0];

    if (deviceId.length !== 36 && deviceOS == 7 && brand !== "Switch") {
        CIF.detect(ni, "Fake OS", "Spoofed their OS (Real: Android/IOS)");
        CIF.ban(ni, "fake-os");
    };
    if (deviceId.length !== 32 && deviceOS !== 7 && brand !== "Switch" && deviceOS !== BuildPlatform.PLAYSTATION && deviceOS !== BuildPlatform.XBOX) {
        CIF.detect(ni, "Fake OS", "Spoofed their OS (Real: Windows 10)");
        CIF.ban(ni, "fake-os");
    };

    if (brand.toUpperCase() !== brand && deviceOS === BuildPlatform.ANDROID && !model.includes("Sword") && brand !== "Switch" && !model.includes("Xiomi")) {
        CIF.detect(ni, "toolbox", "Join with Toolbox");
        CIF.ban(ni, "Toolbox");
    };

    CIF.log(yellow(`${name} > IP & Port: ${ip}, XUID: ${xuid}, Model: ${model}, DeviceId: ${deviceId}`));

	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(deviceId) && deviceId.length === 36) {
		CIF.ban(ni, "DeviceId_Spoof-A");
		return CIF.detect(ni, "DeviceId_Spoof-A", "Invalid device ID regex");
	};

    if (typeof firstLoginedDID[name] !== "string" && isXboxLogined === true) {
        firstLoginedDID[name] = deviceId;
        firstLoginedOS[name] = deviceOS;
    } else if (isXboxLogined === true && firstLoginedDID[name] !== deviceId && firstLoginedOS[name] === deviceOS) {
        CIF.ban(ni, "Deviceid_Spoof-C")
        return CIF.detect(ni, "Deviceid_Spoof-b", "Spoofed their device ID on same account");
    } else {
        firstLoginedDID[name] = deviceId;
        firstLoginedOS[name] = deviceOS;
    };
});
