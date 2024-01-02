import { ContainerId } from "bdsx/bds/inventory";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { InteractPacket } from "bdsx/bds/packets";
import { events } from "bdsx/event";
import { CIF } from "../../main";
import { CIFconfig } from "../util/configManager";

export const isInventoryOpen: Record<string, boolean> = {};
const openInventoryTick: Record<string, number> = {};

events.packetAfter(MinecraftPacketIds.Login).on((packet, netId, packetId) => {
    let name = packet.connreq!.getCertificate().getId();
    isInventoryOpen[name] = true;
});

events.playerJoin.on(ev => {
    isInventoryOpen[ev.player.getName()] = false;
});

events.packetBefore(MinecraftPacketIds.MobEquipment).on((packet, netId, packetId) => {
    let player = netId.getActor();
    if (!player) return;

    if (packet.containerId == ContainerId.Offhand && CIFconfig.Modules.player) {
        let name = player.getName();
        if (!isInventoryOpen[name]) {
            return CIF.failAndFlag(netId, "Offhand-A", "Set offhand without open an inventory", 1);
        }

        let openTick = openInventoryTick[name];
        if (openTick) {
            if (player.getLevel().getCurrentTick() - openTick < 6) {
                return CIF.failAndFlag(netId, "Offhand-B", "Set offhand too fast", 1);
            }
        }
    }
});

events.packetAfter(MinecraftPacketIds.ContainerClose).on((packet, netId, packetId) => {
    let player = netId.getActor();
    if (!player) return;

    let name = player.getName();
    openInventoryTick[name] = 0;
    isInventoryOpen[name] = false;
});

events.packetBefore(MinecraftPacketIds.Interact).on((packet, netId, packetId) => {
    let player = netId.getActor();
    if (!player) return;

    if (InteractPacket.Actions.OpenInventory == packet.action) {
        let name = player.getName();
        openInventoryTick[name] = player.getLevel().getCurrentTick();
        isInventoryOpen[name] = true;
    }
});
