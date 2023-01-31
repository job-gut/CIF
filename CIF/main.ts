import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { CANCEL } from "bdsx/common";
import { bedrockServer } from "bdsx/launcher";
import { serverProperties } from "bdsx/serverproperties";
import { MinecraftPacketIds } from "bdsx/bds/packetids";

if (serverProperties["server-authoritative-movement"] !== "cilent-auth") {
    throw new Error("CIF는 client-auth 를 필요로 합니다.");
};

const deviceModel:Record<string, string>={};

namespace CIF {

    /**
     * 대충 밴 함수
     */
    export function ban(
        ni: NetworkIdentifier,
        reason: "string"
    ) {

        const cheater = ni.getActor()!;
        const cheaterName = cheater.getNameTag()!;
        const users = bedrockServer.serverInstance.getPlayers().filter(p => p.getCommandPermissionLevel() === 0);
        for (const member of users) {
            member.sendMessage(`§c[CIF] ${cheaterName} was banned using ${reason}`);
        }
    }


    /**
     * 대충 핵 감지 함수
     */
    export function detect(
        ni: NetworkIdentifier,
        cheatName: string,
        CheatDescription: string
    ): CANCEL {

        bedrockServer.serverInstance.disconnectClient(ni, `§l§f[§cCIF§f]\n§e${cheatName} Detected`);
        const cheaterName = ni.getActor()!.getNameTag()!;
        const operators = bedrockServer.serverInstance.getPlayers().filter(p => p.getCommandPermissionLevel() === 1);
        for (const gm of operators) {
            gm.sendMessage(`§c[CIF] ${cheaterName} was banned using ${cheatName}(${CheatDescription})`);
        }

        return CANCEL;
    };
};

events.packetAfter(1).on((pkt, ni)=> {
    const connreq = pkt.connreq;
    if (!connreq)return;

    const playerName = connreq.getCertificate().getId();
    const model = connreq.getJsonValue()!.DeviceModel;

    deviceModel[playerName] = model;
});











import "./scripts";import { events } from "bdsx/event";

