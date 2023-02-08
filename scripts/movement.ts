import { Block } from "bdsx/bds/block";
import { BlockPos } from "bdsx/bds/blockpos";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerActionPacket } from "bdsx/bds/packets";
import { Player } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { bool_t } from "bdsx/nativetype";
import { procHacker } from "bdsx/prochacker";

const lastBPS: Record<string, number> = {};
const isSpinAttacking: Record<string, boolean> = {};
const onGround: Record<string, boolean> = {};

const lastpos = new Map<NetworkIdentifier, BlockPos>();

const strafestack: Record<string, number> = {};
const getDamaged: Record<string, boolean> = {};
const isTeleported: Record<string, boolean> = {};
const haveFished: Record<string, boolean> = {};

declare module "bdsx/bds/block" {
    interface Block {
        /**
         * Returns if the block can be spawned mobs
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
         * Returns if player is on ices
         */
        onIce(): boolean;

        isSpinAttacking(): boolean;

        /**
         * Returns player's Last Blocks per second
         * @description Just define.
         */
        lastBPS(): number;

        /**
         * Returns if player is not on mid-air ( client-auth 버그 방지용 )
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

Player.prototype.lastBPS = function () {
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

    const region = pl.getRegion()!;
    const currentPosBlock = region.getBlock(BlockPos.create(pkt.pos.x, pkt.pos.y-1.6, pkt.pos.z));
    const currentHeadPosBlock = region.getBlock(BlockPos.create(pkt.pos.x, pkt.pos.y, pkt.pos.z));

    if (currentPosBlock.isSolid() && currentHeadPosBlock.isSolid()) {
        pl.runCommand("tp ~ ~ ~");
        return CANCEL;
    };
    
});