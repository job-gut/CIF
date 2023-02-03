import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { Player } from "bdsx/bds/player";
import { events } from "bdsx/event";

const lastpos: Record<string, number[]> = {};
const strafestack: Record<string, number> = {};
const lastbps: Record<string, number> = {};
const getDamaged: Record<string, boolean> = {};
const isSpinAttacking: Record<string, boolean> = {};
const isTeleported: Record<string, boolean> = {};
const haveFished: Record<string, boolean> = {};
const onIce: Record<string, boolean> = {};

declare module "bdsx/bds/player" {
    interface Player {
        onIce(): boolean;
    }
}
Player.prototype.onIce = function () {
    // const
    // this.getRegion().getBlock(this.get())
    return true;
}

events.packetBefore(MinecraftPacketIds.MovePlayer).on((pkt, ni) => {

});