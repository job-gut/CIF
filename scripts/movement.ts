import { Block } from "bdsx/bds/block";
import { BlockPos, Vec3 } from "bdsx/bds/blockpos";
import { ArmorSlot } from "bdsx/bds/inventory";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerActionPacket } from "bdsx/bds/packets";
import { GameType, Player, ServerPlayer } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { bool_t, void_t } from "bdsx/nativetype";
import { procHacker } from "bdsx/prochacker";
import { CIF } from "../main";

const lastBPS: Record<string, number> = {};
const isSpinAttacking: Record<string, boolean> = {};
const onGround: Record<string, boolean> = {};

const lastpos = new Map<NetworkIdentifier, Vec3>();

const strafestack: Record<string, number> = {};
const getDamaged: Record<string, boolean> = {};
const isTeleported: Record<string, boolean> = {};
const haveFished: Record<string, boolean> = {};

declare module "bdsx/bds/block" {
    interface Block {
        /**
         * Returns if mobs can be spawned on this block (Func from CIF)
         */
        isSolid(): boolean;
    }
};
Block.prototype.isSolid = procHacker.js(
    "?isSolid@Block@@QEBA_NXZ",
    bool_t,
    { this: Block }
);

declare module "bdsx/bds/player" {
    interface Player {
        /**
         * Returns if player is on ices (Func from CIF)
         */
        onIce(): boolean;

        isSpinAttacking(): boolean;

        /**
         * Returns player's Last Blocks per second (Func from CIF)
         */
        getLastBPS(): number;

        /**
         * Returns if player is not on mid-air (Func from CIF)
         */
        onGround(): boolean;
    }
};

Player.prototype.onIce = function () {
    const pos = BlockPos.create(this.getFeetPos());
    pos.y--;

    const blockName = this.getRegion().getBlock(pos).getName();
    if (blockName.includes("ice")) return true; else return false;
};

Player.prototype.isSpinAttacking = function () {
    const plname = this.getNameTag();
    if (!isSpinAttacking[plname]) isSpinAttacking[plname] = false;
    return isSpinAttacking[plname];
};

Player.prototype.getLastBPS = function () {
    const plname = this.getNameTag();
    if (!lastBPS[plname]) lastBPS[plname] = 0;
    return lastBPS[plname];
};

Player.prototype.onGround = function () {
    const plname = this.getNameTag();
    if (!onGround[plname]) onGround[plname] = false;
    return onGround[plname];
};

events.packetBefore(MinecraftPacketIds.PlayerAction).on((pkt, ni) => {
    const plname = ni.getActor()!.getNameTag()!;
    if (pkt.action === PlayerActionPacket.Actions.StartSpinAttack) {
        isSpinAttacking[plname] = true;
    } else if (pkt.action === PlayerActionPacket.Actions.StopSpinAttack) {
        isSpinAttacking[plname] = false;
    };
});

events.packetBefore(MinecraftPacketIds.MovePlayer).on((pkt, ni) => {
    const pl = ni.getActor()!;
    const plname = pl.getNameTag()!;
    onGround[plname] = pkt.onGround;

    const movePos = pkt.pos;

    const region = pl.getRegion()!;
    const currentPosBlock = region.getBlock(BlockPos.create(movePos.x, movePos.y-1.6, movePos.z));
    const currentHeadPosBlock = region.getBlock(BlockPos.create(movePos.x, movePos.y, movePos.z));

    if (currentPosBlock.isSolid() && currentHeadPosBlock.isSolid() &&
    !currentPosBlock.getName().includes("air") && !currentHeadPosBlock.getName().includes("air")
    && pl.getGameType() !== GameType.Spectator
    && pl.getGameType() !== GameType.CreativeSpectator
    && pl.getGameType() !== GameType.Creative
    && pl.getGameType() !== GameType.SurvivalSpectator) {
        pl.runCommand("tp ~ ~ ~");
        return CANCEL;
    };
    
    const torso = pl.getArmor(ArmorSlot.Torso);
    if (torso.getRawNameId() === "elytra") return;
    if (isTeleported[plname]) return;
    if (pl.isSpinAttacking()) return;

    const lastPos = lastpos.get(ni)!;
    const plSpeed = pl.getSpeed();

    //5.62 is max speed without any speed effects and while sprinting.
    const maxBPS = plSpeed * 45;

    let bps: number;

    if (lastPos) {
        const x1 = lastPos.x;
        const x2 = movePos.x;
        const y1 = lastPos.y;
        const y2 = movePos.y;

        const xDiff = (x1-x2)^2;
        const yDiff = (y1-y2)^2;

        bps = Number(Math.sqrt(xDiff + yDiff).toFixed(2));
    } else {
        bps = 0;
    };

    if (bps > maxBPS && bps > 5.62) {

        if (pl.getLastBPS() === bps) {
            strafestack[plname] = strafestack[plname] ? strafestack[plname] + 1 : 1;
            if (strafestack[plname] > 14) {
                strafestack[plname] = 0;
                return CIF.detect(ni, "Speed-B", "Strafe");
            };
        };


        if (pl.onIce() && pl.isRiding()) {
            //대충 max bps 구하기 처리하는거 만들기
        } else if (pl.onIce() && !pl.isRiding()) {
            //대충 max bps 구해서 처리하는거 만들기
        } else if (!pl.onIce() && pl.isRiding()) {
            //대충 max bps 구해서 처리하는거 만들기
        };

    };

    lastBPS[plname] = bps;
    lastpos.set(ni, movePos);
});

const hasTeleport = procHacker.hooking("?teleportTo@Player@@UEAAXAEBVVec3@@_NHH1@Z", void_t, null, ServerPlayer, Vec3)((pl, pos) => {
    const plname = pl.getNameTag()!;
    isTeleported[plname] = true;
    setTimeout(async () => {
        isTeleported[plname] = false;
    }, 1000);

    return hasTeleport(pl, pos);
});