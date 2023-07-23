import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { CIFconfig } from "./configManager";

for (let i = 1; i < 200; i++) {
	events.packetRaw(i).on((ptr, size, ni, pktid)=> {
		if (CIFconfig.Modules.log_packets) 
			console.log(MinecraftPacketIds[pktid], ni.getActor()?.getName());
	});
};