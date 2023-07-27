import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { ActorEventPacket } from "bdsx/bds/packets";
import { events } from "bdsx/event";
import { CIF } from "../../main";
import { CIFconfig } from "../util/configManager";

events.packetBefore(MinecraftPacketIds.ActorEvent).on((pkt, ni)=> {
	if (CIFconfig.Modules.xp !== true) return;


    const action = pkt.event;
    if (action === ActorEventPacket.Events.PlayerAddXpLevels) {
        CIF.ban(ni, "xp");
        return CIF.detect(ni, "xp", "Fake PlayerAddXpLevels Packet");
    };
});

events.packetBefore(MinecraftPacketIds.SpawnExperienceOrb).on((pkt, ni)=> {
	if (CIFconfig.Modules.xp !== true) return;


    CIF.ban(ni, "xp");
    return CIF.detect(ni, "xp", "Summon XP Orbs");
});