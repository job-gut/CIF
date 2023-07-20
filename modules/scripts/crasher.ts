import { NetworkConnection, NetworkSystem } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { VoidPointer } from "bdsx/core";
import { events } from "bdsx/event";
import { int32_t } from "bdsx/nativetype";
import { CxxStringWrapper } from "bdsx/pointer";
import { procHacker } from "bdsx/prochacker";
import { CIF } from "../../main";
import { CIFconfig } from "../util/configManager";
import { CANCEL } from "bdsx/common";

const PPSsound: Record<string, number> = {};
const PPSact: Record<string, number> = {};

events.packetRaw(MinecraftPacketIds.ClientCacheBlobStatus).on((ptr, size, ni) => {
	if (CIFconfig.Modules.crasher !== true) return;


    if (ptr.readVarUint() >= 0xfff || ptr.readVarUint() >= 0xfff) {
        CIF.ban(ni, "DoS");
        return CIF.detect(ni, "DoS", "DoS using ClientCacheBlobStatus Packet");
    };
});


events.packetBefore(MinecraftPacketIds.LevelSoundEvent).on((pkt, ni) => {
    const sound = pkt.sound;
    if (sound === 0) {
		if (CIFconfig.Modules.crasher !== true) return;


        CIF.ban(ni, "crasher");
        return CIF.detect(ni, "crasher", "Invalid LevelSoundPacket");
    };

	if (pkt.extraData === -1 && !pkt.entityType) {
		// CIF.ban(ni, "SwingSound");
		// return CIF.detect(ni, "SwingSound", "Invalid Sound on Swing Motion");
		return CANCEL;
	};

    if (sound !== 42 && sound !== 43) {
		if (CIFconfig.Modules.crasher !== true) return;


        const pl = ni.getActor();
        if (!pl) return;
        
        const plname = pl.getName();
        PPSsound[plname] = PPSsound[plname] ? PPSsound[plname] + 1 : 1;

        if (PPSsound[plname] > 39) {
            if (PPSsound[plname] > 40) return CANCEL;
            return CIF.detect(ni, "Sound Spam", "Spamming Sound Packets");
        };

        setTimeout(async () => {
            PPSsound[plname]--;
        }, (1000));
    };
});

events.packetBefore(MinecraftPacketIds.ActorEvent).on((pkt, ni) => {
	if (CIFconfig.Modules.crasher !== true) return;


    const pl = ni.getActor()!;
    const plname = pl.getName()!;
    PPSact[plname] = PPSact[plname] ? PPSact[plname] + 1 : 1;

    if (PPSact[plname] > 39) {
        if (PPSact[plname] > 40) return CANCEL;
        return CIF.detect(ni, "Act Spam", "Spamming ActorEvent Packets");
    };
    setTimeout(async () => {
        PPSact[plname]--;
    }, (1000));
});

events.packetRaw(MinecraftPacketIds.PlayerList).on((ptr, size, ni)=> {
	if (CIFconfig.Modules.crasher !== true) return;


	ptr.move(1);

	if (ptr.readVarUint() === 1
	&& ptr.readVarUint() === 4294967295
	&& ptr.readVarUint() === 0
	&& size === 7) {
		CIF.ban(ni, "Crasher");
		return CIF.detect(ni, "Crasher", "Send Invalid PlayerList Packet")
	}
});

// const Warns: Record<string, number> = {};
// const ipBlocked: Record<string, boolean> = {};

const receivePacket = procHacker.hooking(
    "?receivePacket@NetworkConnection@@QEAA?AW4DataStatus@NetworkPeer@@AEAV?$basic_string@DU?$char_traits@D@std@@V?$allocator@D@2@@std@@AEAVNetworkSystem@@AEBV?$shared_ptr@V?$time_point@Usteady_clock@chrono@std@@V?$duration@_JU?$ratio@$00$0DLJKMKAA@@std@@@23@@chrono@std@@@5@@Z",
    int32_t,
    null,
    NetworkConnection,
    CxxStringWrapper,
    NetworkSystem,
    VoidPointer,
)((conn, data, networkSystem, time_point) => {
    // const address = conn.networkIdentifier.getAddress();

    //Block All Packets from Detected Player
    if (conn.networkIdentifier.getActor()) {
        const plname = conn.networkIdentifier.getActor()!.getName();
        if (CIF.wasDetected[plname] === true) {
            return 1;
        };
    };

	
	// if (CIFconfig.Modules.crasher !== true) return receivePacket(conn, data, networkSystem, time_point);


    // const ip = address.split("|")[0];
    // if (ip === "10.10.10.10") return receivePacket(conn, data, networkSystem, time_point);

    // if (ipBlocked[ip]) {
    //     conn.disconnect();
    //     CIF.announce(`§c[§fCIF§c] §c${ip} §6tried to connect §c(IP Blocked)`);
    //     CIF.log(`${ip} tried to connect (IP Blocked)`);
    //     return 1;
    // };

    // const id = data.valueptr.getUint8();
    // if (Warns[address] > 14 || id === MinecraftPacketIds.PurchaseReceipt) {
    //     conn.disconnect();
    //     ipBlocked[ip] = true;
    //     CIF.ipDetect(conn.networkIdentifier, "crasher", "CVE: Send Invalid Packets without Minecraft Connection");
    //     return 1;
    // };

    // if (id === 0) {
    //     Warns[address] = Warns[address] ? Warns[address] + 1 : 1;
    // };

    return receivePacket(conn, data, networkSystem, time_point);
});

events.networkDisconnected.on(ni => {
    if (ni) {
        // Warns[ni.getAddress()] = 0;
        CIF.resetDetected(ni.getActor()?.getName()!);
    };
});

events.packetSend(MinecraftPacketIds.Disconnect).on((pkt, ni)=> {
	if (ni) {
		// Warns[ni.getAddress()] = 0;
        CIF.resetDetected(ni.getActor()?.getName()!);
	};
});