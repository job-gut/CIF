import { BlockPos } from "bdsx/bds/blockpos";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerActionPacket } from "bdsx/bds/packets";
import { Player } from "bdsx/bds/player";
import { events } from "bdsx/event";

const lastBPS: Record<string, number> = {};
const isSpinAttacking: Record<string, boolean> = {};

const lastpos: Record<string, number[]> = {};
const strafestack: Record<string, number> = {};
const getDamaged: Record<string, boolean> = {};
const isTeleported: Record<string, boolean> = {};
const haveFished: Record<string, boolean> = {};

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
    }
};

Player.prototype.onIce = function () {
    const pos = BlockPos.create(this.getFeetPos());
    pos.y--;

    const blockName = this.getRegion().getBlock(pos).getName();
    if (blockName.includes("ice")) return true
    else return false;
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

events.packetBefore(MinecraftPacketIds.PlayerAction).on((pkt, ni)=> {
    const plname = ni.getActor()!.getNameTag()!;
    if (pkt.action === PlayerActionPacket.Actions.StartSpinAttack) {
        isSpinAttacking[plname] = true;
    } else if (pkt.action === PlayerActionPacket.Actions.StopSpinAttack) {
        isSpinAttacking[plname] = false;
    };
});

events.packetBefore(MinecraftPacketIds.MovePlayer).on((pkt, ni) => {

});