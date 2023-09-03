import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { yellow } from "colors";
import { CIF } from "../../main";
import { CIFconfig } from "../util/configManager";
import { readFileSync, readdirSync } from "fs";


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
    for (const bannedPlayer of banlist) {
        if (bannedPlayer === publicIDKey || bannedPlayer === deviceId) {
            const bannedReason = readFileSync("../CIFbanList/" + bannedPlayer).toString().split(":")[1];
            CIF.wasDetected[name] = true;
            // bedrockServer.serverInstance.disconnectClient(ni, `§l§f§c[§fCIF§c]\n§c더 이상 해당 계정으로 접속 할 수 없습니다`);
            CIF.announce(`§c${name} §6failed to connect §7(§c${bannedReason}§7)`);
            CIF.log(`${name} failed to connect ` + "(".white + `${bannedReason.red})`.yellow);
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
        CIF.detect(ni, "Fake OS", "Spoof their OS (Real: Android/IOS)");
        CIF.ban(ni, "fake-os");
    };
    if (deviceId.length !== 32 && deviceOS !== 7 && brand !== "Switch") {
        CIF.detect(ni, "Fake OS", "Spoof their OS (Real: Windows 10)");
        CIF.ban(ni, "fake-os");
    };

    if (brand.toUpperCase() !== brand && deviceOS !== 2 && model !== "To Be Filled By O.E.M. To Be Filled By O.E.M." && !model.includes("ASUS") && !model.includes("SAMSUNG") && !model.includes("OnePlus") && model !== "System Product Name System manufacturer" && model !== "System devices (Standard system devices)" && model !== "To be filled by O.E.M. To be filled by O.E.M." && !model.includes("Sword") && model !== "Desktop DANAWA COMPUTER Co." && brand !== "Switch") {
        CIF.detect(ni, "toolbox", "Join with Toolbox");
        CIF.ban(ni, "Toolbox");
    };

    CIF.log(yellow(`${name} > IP & Port: ${ip}, XUID: ${xuid}, Model: ${model}, DeviceId: ${deviceId}`));

    if (deviceId.length === 36) {
        if (deviceId.includes("g") || deviceId.includes("h") || deviceId.includes("i") || deviceId.includes("j") || deviceId.includes("k") || deviceId.includes("l") || deviceId.includes("m") || deviceId.includes("n") || deviceId.includes("o") || deviceId.includes("p") || deviceId.includes("q") || deviceId.includes("r") || deviceId.includes("s") || deviceId.includes("t") || deviceId.includes("u") || deviceId.includes("v") || deviceId.includes("w") || deviceId.includes("x") || deviceId.includes("y") || deviceId.includes("z")) {
            CIF.detect(ni, "zephyr", "Zephyr DeviceId Spoof");
            return CIF.ban(ni, "Zephyr DeviceId Spoof");
        };
    };

    if (typeof firstLoginedDID[name] !== "string" && isXboxLogined === true) {
        firstLoginedDID[name] = deviceId;
        firstLoginedOS[name] = deviceOS;
    } else if (isXboxLogined === true && firstLoginedDID[name] !== deviceId && firstLoginedOS[name] === deviceOS) {
        CIF.ban(ni, "deviceid_spoof")
        return CIF.detect(ni, "deviceid_spoof", "Spoofs their deviceID");
    } else {
        firstLoginedDID[name] = deviceId;
        firstLoginedOS[name] = deviceOS;
    };
});
