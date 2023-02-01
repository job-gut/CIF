import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { BuildPlatform } from "bdsx/common";
import { events } from "bdsx/event";
import { CIF } from "../main";


export const nameMap = new Map<NetworkIdentifier, string>();

export const deviceModelMap = new Map<NetworkIdentifier, string>();
export const deviceIdMap = new Map<NetworkIdentifier, string>();

enum TitleId {
    ANDROID = 1739947436,
    IOS = 1810924247,
    WINDOWS_10 = 896928775,
    PLAYSTATION = 2044456598,
    NINTENDO = 2047319603,
    XBOX = 1828326430,
}

events.packetAfter(MinecraftPacketIds.Login).on((pkt, ni) => {
    if (pkt.connreq === null) return;
    const deviceId = pkt.connreq.getDeviceId();
    const deviceOS = pkt.connreq.getDeviceOS();
    const cert = pkt.connreq.getCertificate();
    const name = cert.getId();
    const ip = ni.getAddress();
    const xuid = cert.getXuid()
    const model = pkt.connreq.getJsonValue()!.DeviceModel;

    nameMap.set(ni, name);
    deviceModelMap.set(ni, model);
    deviceIdMap.set(ni, deviceId);

    if (name.length > 20) {
        CIF.detect(ni, "long_name", "Too long nickname");
    }

    if (name === "") {
        CIF.detect(ni, "invalid_name", "Nickname is null");
    };

    const invisibleChars = ["⠀", " ", " ", " ", "　", " ", " ", " ", " ", "﻿", " ", " ", "󠀠", " ", " ", "​", " "];

    for (let i = 0; i < invisibleChars.length; i++) {
        const char = invisibleChars[i];
        if (name.includes(char)) {
            CIF.detect(ni, "invisible_name", "Nickname includes disallowed space");
            return;
        }
    }

    const brand = model.split(" ")[0];
    const titleId = cert.json.value()["extraData"]["titleId"];

    if (TitleId[titleId] && TitleId[BuildPlatform[deviceOS] as any] != titleId) {
        CIF.detect(ni, "os_spoof", "Join with wrong edition");
    }

    if (brand.toUpperCase() !== brand && deviceOS !== 2) {
        CIF.detect(ni, "toolbox", "Join with Toolbox");
    };
});
