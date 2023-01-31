import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { bedrockServer } from "bdsx/launcher";

const lastpos: Record<string, number[]> = {};
const strafestack: Record<string, number> = {};
const lastbps: Record<string, number> = {};
const getDamaged: Record<string, boolean> = {};
const isSpinAttacking: Record<string, boolean> = {};
const isTeleported: Record<string, boolean> = {};
const haveFished: Record<string, boolean> = {};
const onIce: Record<string, boolean> = {};

events.packetBefore(MinecraftPacketIds.MovePlayer).on((pkt, ni)=> {

});