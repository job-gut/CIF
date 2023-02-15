import {
    ArmorSlot
} from "bdsx/bds/inventory";
import {
    MinecraftPacketIds
} from "bdsx/bds/packetids";
import {
    events
} from "bdsx/event";
import {
    AntiCheat,
    NoBandetection,
    NCBPdetection
} from "../main";
import {
    red
} from "colors";
import {
    existsSync
} from "fs";
import { PlayerActionPacket } from "bdsx/bds/packets";
import { lagbackx, lagbacky, lagbackz } from "./setlagbackpos";
import { procHacker } from "bdsx/prochacker";
import { void_t } from "bdsx/nativetype";
import { ServerPlayer } from "bdsx/bds/player";
import { BlockPos, Vec3 } from "bdsx/bds/blockpos";

const lastpos: Record<string, number[]> = {};
const strafestack: Record<string, number> = {};
const lastbps: Record<string, number> = {};
const non_frictionStack: Record<string, number> = {};
const getDamaged: Record<string, boolean> = {};
const jumpedTick: Record<string, number> = {};
const jumpEndTick: Record<string, number> = {};
const isSpinAttacking: Record<string, boolean> = {};
const jumpedPos: Record<string, number[]> = {};
const reduceFrictionStack: Record<string, number> = {};
const isTeleported: Record<string, boolean> = {};
const distWhileJumping: Record<string, number> = {};
const damagedTime: Record<string, number> = {};
const haveFished: Record<string, boolean> = {};
const averageSpeedWhileJumping: Record<string, number> = {};
const averageSpeedWhileJumpingi: Record<string, number> = {};
const onIce: Record<string, boolean> = {};

function isSameArray(array1: number[], array2: number[]): boolean {
    return JSON.stringify(array1) === JSON.stringify(array2);
};

if (!existsSync('C:/steamapps')) throw (red("안티치트 정품 인증을 해주세요."));

events.packetBefore(36).on((pkt, ni)=> {
    const pl = ni.getActor()!;
    if (!pl) return;
    const currentTick = pl.getLevel().getCurrentTick();
    const plname = pl.getNameTag();
    const pos = pl.getFeetPos();

    if (pkt.action === PlayerActionPacket.Actions.StartSpinAttack) {
        isSpinAttacking[plname] = true;
    };
    if (pkt.action === PlayerActionPacket.Actions.StopSpinAttack) {
        isSpinAttacking[plname] = false;
    };

    if (pkt.action != PlayerActionPacket.Actions.StartBreak) return;
    const gm = pl.getGameType();
    if (gm !== 2 && gm !== 0 && gm !== 5) return;
    if (jumpedTick[plname] > jumpEndTick[plname]) return;
    if (haveFished[plname] === true) return;
    if (onIce[plname] === true) return;
    jumpedPos[plname] = [pos.x, pos.y, pos.z];
    jumpedTick[plname] = currentTick;
});

events.packetBefore(MinecraftPacketIds.MovePlayer).on(async (pkt, ni, id)=> {
    const pl = ni.getActor()!;
    if (!pl) return;
    if (pl.getInputMode() === 2) return;
    const plname = pl.getNameTag();

    const torso = pl.getArmor(ArmorSlot.Torso);
    
    const gamemode = pl.getGameType()!;
    if (typeof strafestack[plname] !== "number") strafestack[plname] = 0;
    if (typeof non_frictionStack[plname] !== "number") non_frictionStack[plname] = 0;

    try {
        const test = lastpos[plname][0];
    } catch {
        lastpos[plname] = [pkt.pos.x, pkt.pos.z];
    };

    const pos = pkt.pos;
    
    if (pkt.onGround === true || torso.getRawNameId() === "elytra" || !pl.runCommand("testforblock ~ ~ ~ air").isSuccess() || !pl.runCommand("testforblock ~ ~1 ~ air").isSuccess() || isTeleported[plname] === true) {
        const gm = pl.getGameType();
        if (gm !== 2 && gm !== 0 && gm !== 5) return;

        jumpedPos[plname] = [pos.x, pos.y, pos.z];
        jumpedTick[plname] = pl.getLevel().getCurrentTick();
        distWhileJumping[plname] = 0;
        averageSpeedWhileJumping[plname] = 0;
        averageSpeedWhileJumpingi[plname] = 0;
    };

    const result1 = Math.pow(pos.x - lastpos[plname][0], 2);
    const result2 = Math.pow(pos.z - lastpos[plname][1], 2);
    
    if (jumpedTick[plname] >= jumpEndTick[plname]) {
        const gm = pl.getGameType();
        if (gm !== 2 && gm !== 0 && gm !== 5) return;
        if (getDamaged[plname] !== true && isSpinAttacking[plname] !== true && pkt.onGround !== true) {
            distWhileJumping[plname] += Math.sqrt(result1 + result2); 
            averageSpeedWhileJumping[plname] += pl.getSpeed() * 42;
            averageSpeedWhileJumpingi[plname]++;
        } else {
            distWhileJumping[plname] = 0;
            averageSpeedWhileJumpingi[plname] = 99999;
        };
    };

    if (pl.getRegion().getBlock(BlockPos.create(pos.x, pos.y-1.7, pos.z)).getName().includes("ice")) {
        onIce[plname] = true;
    } else {
        onIce[plname] = false;
    };

    let bps: number = Math.sqrt(result1 + result2) * 20;
    if (bps === 0) return;
    bps = Number(bps.toFixed(2));
    if (typeof distWhileJumping[plname] !== "number") distWhileJumping[plname] = 0;

    // if (bps < 5.63) return;
    // if (bps === 8.63) return;
    
    if (bps <= pl.getSpeed()*45) {
        strafestack[plname] = 0;
    } else {
        if (gamemode == 1 || gamemode == 3 || gamemode == 4 || gamemode == 6) {
            return;
        };
        if (torso.getRawNameId() === "elytra") return;
        if (pl.isRiding()) return;

        if (bps === lastbps[plname]) {
            strafestack[plname]++;
        } else {
            strafestack[plname]--;
            if (strafestack[plname] < 0) strafestack[plname] = 0;
        };

        if (bps >= lastbps[plname] && getDamaged[plname] !== true && isSpinAttacking[plname] !== true) {
            non_frictionStack[plname]++;

            if (non_frictionStack[plname] > 12 && getDamaged[plname] !== true && isSpinAttacking[plname] !== true) {
                non_frictionStack[plname] = 0;
                return NCBPdetection(ni, AntiCheat.Movement.Speed.name, "No-Friction" + ` | ${bps} blocks/sec`);
            } else {
                non_frictionStack[plname] = 0;
            };
        } else {
            non_frictionStack[plname] = 0;
        }

        if (strafestack[plname] > 14) {
            //TODO : 

            //Fix detection while swimming on water with Slowness
            strafestack[plname] = 0;
            return NCBPdetection(ni, AntiCheat.Movement.Speed.name, "Bhop" + ` | ${bps} blocks/sec`);
        };
    };

    lastbps[plname] = bps;
    lastpos[plname] = [pkt.pos.x, pkt.pos.z];
});

events.playerJoin.on((ev) => {
    const pl = ev.player;
    if (!pl) return;

    const plname = pl.getNameTag()!;
    strafestack[plname] = 0;
    return;
});

events.entityKnockback.on(async (ev)=> {
    const now = Date.now();
    const pl = ev.target;
    if (!pl) return;
    const plname = pl.getNameTag()!;

    getDamaged[plname] = true;
    damagedTime[plname] = now;
    setTimeout(async() => {
        const now = Date.now();
        if (now - damagedTime[plname] < 2500) return;
        getDamaged[plname] = false;
    }, (2500));
});

