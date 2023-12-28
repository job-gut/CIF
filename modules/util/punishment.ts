import { NetworkConnection, NetworkSystem } from "bdsx/bds/networkidentifier";
import { VoidPointer } from "bdsx/core";
import { int32_t } from "bdsx/nativetype";
import { CxxStringWrapper } from "bdsx/pointer";
import { procHacker } from "bdsx/prochacker";
import { CIF } from "../../main";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";


const receivePacket = procHacker.hooking(
    "?receivePacket@NetworkConnection@@QEAA?AW4DataStatus@NetworkPeer@@AEAV?$basic_string@DU?$char_traits@D@std@@V?$allocator@D@2@@std@@AEBV?$shared_ptr@V?$time_point@Usteady_clock@chrono@std@@V?$duration@_JU?$ratio@$00$0DLJKMKAA@@std@@@23@@chrono@std@@@5@@Z",
    int32_t,
    null,
    NetworkConnection,
    CxxStringWrapper,
    VoidPointer,
)((conn, data, time_point) => {
    //Block All Packets from Detected Player
    if (conn.networkIdentifier.getActor()) {
        const plname = conn.networkIdentifier.getActor()!.getName();
        if (CIF.wasDetected[plname] === true) {
            return 1;
        };
    };

    return receivePacket(conn, data, time_point);
});

events.networkDisconnected.on(ni => {
    if (ni) {
		const plname = ni.getActor()?.getName()!;
		CIF.resetDetected(plname);
    };
});

events.packetSend(MinecraftPacketIds.Disconnect).on((pkt, ni)=> {
	if (ni) {
		const plname = ni.getActor()?.getName()!;
		CIF.resetDetected(plname);
	};
});