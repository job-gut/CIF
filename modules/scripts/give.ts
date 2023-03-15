import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { CIF } from "../main";

events.packetRaw(MinecraftPacketIds.InventoryTransaction).on((ptr, size, ni)=> {
    ptr.move(1);
    try {
        for (let i = 0; i < size; i++) {
            if (ptr.readVarUint() === 99999) {
                CIF.ban(ni, "give")
                return CIF.detect(ni, "give", "Fake InventoryTransaction Packet");
            };
        };
    } catch {};
});