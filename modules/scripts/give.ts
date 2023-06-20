import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { CIF } from "../../main";
import { CANCEL } from "bdsx/common";
import { CIFconfig } from "../util/configManager";
import { InputMode } from "bdsx/bds/player";

const transactionPerSecond: Record<string, number> = {};

events.packetRaw(MinecraftPacketIds.InventoryTransaction).on((ptr, size, ni)=> {
    ptr.move(1);

	const player = ni.getActor()!;
	const name = player.getName();

	if (CIFconfig.Modules.crasher === true && player.getInputMode() === InputMode.Mouse) {
		if (typeof transactionPerSecond[name] !== "number") transactionPerSecond[name] = 0;
		transactionPerSecond[name]++;
		setTimeout(() => {
			transactionPerSecond[name]--;
			if (transactionPerSecond[name] < 0) transactionPerSecond[name] = 0;
		}, 996).unref(); 

		if (transactionPerSecond[name] > 249) {
			if (transactionPerSecond[name] > 250) return CANCEL;
			CIF.ban(player.getNetworkIdentifier(), "Crasher");
			return CIF.detect(player.getNetworkIdentifier(), "crasher", "Spamming InventoryTransAction Packet");
		};
	};

	
    try {
        for (let i = 0; i < size; i++) {
            if (ptr.readVarUint() === 99999) {
                CIF.ban(ni, "give")
                return CIF.detect(ni, "give", "Fake InventoryTransaction Packet");
            };
        };
    } catch {};
});