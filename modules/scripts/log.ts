import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { CIF } from "../../main";

events.packetAfter(MinecraftPacketIds.Text).on((pkt, ni) => {
    CIF.log(`<${pkt.name}> ${pkt.message}`);
});

events.packetAfter(MinecraftPacketIds.CommandRequest).on((pkt, ni) => {
    CIF.log(`${ni.getActor()!.getName()} : ${pkt.command}`);
});