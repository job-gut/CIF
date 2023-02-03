import { BlockPos } from "bdsx/bds/blockpos";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
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
        //No JSDoc
        isSpinAttacking(): boolean;
        /**
         * Returns player's Last Blocks per second
         * @deprecated Just define.
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

events.packetBefore(MinecraftPacketIds.MovePlayer).on((pkt, ni) => {

});