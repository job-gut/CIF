import { Vec3 } from "bdsx/bds/blockpos";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { AnimatePacket } from "bdsx/bds/packets";
import { GameType, Player, ServerPlayer } from "bdsx/bds/player";
import { BuildPlatform, CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { bedrockServer } from "bdsx/launcher";
import { CIF } from "../main";
import { lastRotations } from "./movement";

const MismatchAuraWarn = new Map<string, number>();
const susPacketAuraWarn: Record<string, number> = {};

const lastAnimateTime: Record<string, number> = {};
const doubleAnimateStack: Record<string, number> = {};

function mismatchWarn(player: Player): CANCEL {
    const name = player.getNameTag();
    if (MismatchAuraWarn.get(name) === undefined) {
        MismatchAuraWarn.set(name, 1);
        return CANCEL;
    };
    MismatchAuraWarn.set(name, MismatchAuraWarn.get(name)! + 1);
    setTimeout(async () => {
        MismatchAuraWarn.set(name, MismatchAuraWarn.get(name)! - 1);
        if (MismatchAuraWarn.get(name)! < 0) MismatchAuraWarn.set(name, 0);
    }, 3000);
    if (MismatchAuraWarn.get(name)! > 2) {
        CIF.ban(player.getNetworkIdentifier(), "Aura-A");
        return CIF.detect(player.getNetworkIdentifier(), "aura-A", "Mismatch head rotation");
    };
    return CANCEL;
};
function degreesToRadians(degrees: number): number {
    return degrees * Math.PI / 180;
}
function getVectorByRotation(rotation: { x: number, y: number }): Vec3 {
    const x = Math.cos(degreesToRadians(rotation.x));

    const y = Math.sin(degreesToRadians(rotation.y));

    const z = Math.sin(degreesToRadians(rotation.x));

    bedrockServer.executeCommand(`particle minecraft:endrod ${x} ${y} ${z}`);

    return Vec3.create(x, y, z);
}
function isMismatchAttack(player: ServerPlayer, victim: ServerPlayer, viewVector: Vec3 = player.getViewVector()): boolean {
    const victimPos = victim.getFeetPos();
    victimPos.y += 0.9;
    const playerPos = player.getPosition();

    if (victimPos.distance(playerPos) < 1) {
        return false;
    };

    let reach = playerPos.distance(victimPos);
    viewVector.multiply(reach);
    viewVector.x += playerPos.x;
    viewVector.y += playerPos.y;
    viewVector.z += playerPos.z;
    const distanceX = Math.abs(viewVector.x - victimPos.x) / reach;
    const distanceZ = Math.abs(viewVector.z - victimPos.z) / reach;
    const hitRange = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceZ, 2));
    if (hitRange > 1) {
        return true;
    };
    return false;
}

//Animate Packet -> playerAttack Event

events.packetBefore(MinecraftPacketIds.Animate).on((pkt, ni) => {
    const pl = ni.getActor()!;
    const plname = pl.getNameTag();
    const now = Date.now();

    if (pkt.action !== AnimatePacket.Actions.SwingArm) return;
    if (!lastAnimateTime[plname]) lastAnimateTime[plname] = now;
    if (now - lastAnimateTime[plname] < 3) {
        doubleAnimateStack[plname] = doubleAnimateStack[plname] ? doubleAnimateStack[plname] + 1 : 1;
    };

    lastAnimateTime[plname] = now;
});

let checkAuraB: NodeJS.Timeout;

bedrockServer.afterOpen().then(() => {

    checkAuraB = setInterval(() => {
        const players = bedrockServer.serverInstance.getPlayers();
        for (const pl of players) {
            const plname = pl.getNameTag();
            const gamemode = pl.getGameType();
            if (gamemode !== 2 && gamemode !== 0) continue;

            if (doubleAnimateStack[plname] > 3) {
                susPacketAuraWarn[plname] = susPacketAuraWarn[plname] ? susPacketAuraWarn[plname] + 1 : 1;
                if (susPacketAuraWarn[plname] > 1) {
                    susPacketAuraWarn[plname] = 0;
                    doubleAnimateStack[plname] = 0;

                    CIF.detect(pl.getNetworkIdentifier(), "Aura-B", "Send SUS Packets while fighting");
                };
            } else if (doubleAnimateStack[plname] < 3 && doubleAnimateStack[plname] > 0) {
                susPacketAuraWarn[plname] = susPacketAuraWarn[plname] ? susPacketAuraWarn[plname] - 1 : 0;
                if (susPacketAuraWarn[plname] < 0) susPacketAuraWarn[plname] = 0;
            };
            doubleAnimateStack[plname] = 0;
        };
    }, 1000);

});

events.serverLeave.on(() => {
    clearInterval(checkAuraB);
});

events.playerAttack.on((ev) => {
    if (!ev.victim.isPlayer()) return;
    if (ev.player.getGameType() === GameType.Creative) return;
    //if (ev.player.getPlatform() === BuildPlatform.ANDROID || ev.player.getPlatform() === BuildPlatform.IOS) return;

    const now = Date.now();
    const player = ev.player as ServerPlayer;
    const name = player.getNameTag()!;
    if (now - lastAnimateTime[name] < 2) {
        doubleAnimateStack[name] = doubleAnimateStack[name] ? doubleAnimateStack[name] - 1 : 0;
        if (doubleAnimateStack[name] < 0) doubleAnimateStack[name] = 0;
    };
    const prevRotations = lastRotations.get(name);
    if (prevRotations === undefined || prevRotations.length !== 3) return;
    const check1 = isMismatchAttack(player, ev.victim);
    const check2 = isMismatchAttack(player, ev.victim, getVectorByRotation(prevRotations[1]));
    const check3 = isMismatchAttack(player, ev.victim, getVectorByRotation(prevRotations[2]));
    if (check1 && check2 && check3) {
        return mismatchWarn(player);
        // return CIF.detect(player.getNetworkIdentifier(),"Aura-A","Mismatched attacks");
    } else if (check1) {
        // 전부다 감지하지 않더라도 비정상적인 카메라 무빙으로 인한 것이기 때문에, 캔슬만.
        return CANCEL;
    }
});