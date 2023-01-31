import { NetworkConnection, NetworkHandler } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { VoidPointer } from "bdsx/core";
import { events } from "bdsx/event";
import { int32_t } from "bdsx/nativetype";
import { CxxStringWrapper } from "bdsx/pointer";
import { procHacker } from "bdsx/prochacker";
import { CIF } from "../main";

const UINTMAX = 0xffffffff;


events.packetBefore(MinecraftPacketIds.MovePlayer).on((pkt, ni)=> {
    if (pkt.pos.x > UINTMAX || pkt.pos.y > UINTMAX || pkt.pos.z > UINTMAX) {
        CIF.ban(ni, "crasher");
        return CIF.detect(ni, "crasher", "Illegal Position");
    };
});

events.packetBefore(MinecraftPacketIds.PlayerAuthInput).on((pkt, ni)=> {
    if (pkt.pos.x > UINTMAX || pkt.pos.y > UINTMAX || pkt.pos.z > UINTMAX || pkt.moveX > UINTMAX || pkt.moveZ > UINTMAX) {
        CIF.ban(ni, "crasher");
        return CIF.detect(ni, "crasher", "Illegal Position");
    };
});


events.packetRaw(MinecraftPacketIds.ClientCacheBlobStatus).on((ptr, size, ni) => {
    if (ptr.readVarUint() >= 0xfff || ptr.readVarUint() >= 0xfff) {
        CIF.ban(ni, "DoS");
        return CIF.detect(ni, "DoS", "DoS using ClientCacheBlobStatus Packet");
    };
});


//빨간 줄 불편해도 무시하세요
events.packetBefore(123).on(async (pkt, ni)=> {
    const sound = pkt.sound;
    if (sound === 0) {
        CIF.ban(ni, "crasher");
        return CIF.detect(ni, "crasher", "Invalid LevelSoundPacket");
    };
});


events.packetRaw(93).on((ptr, size, ni) => {
    const pl = ni.getActor()!;
    if (!pl) return CANCEL;

    if (pl.hasTag("CIFcanCrash")) return;

    pl.sendMessage("§l§c스킨을 적용하시려면 서버에 재접속 해주세요!");
    pl.playSound("random.break");
    return CANCEL;
});


const Warns: Record<string, number> = {};
const receivePacket = procHacker.hooking(
    "?receivePacket@NetworkConnection@@QEAA?AW4DataStatus@NetworkPeer@@AEAV?$basic_string@DU?$char_traits@D@std@@V?$allocator@D@2@@std@@AEAVNetworkHandler@@AEBV?$shared_ptr@V?$time_point@Usteady_clock@chrono@std@@V?$duration@_JU?$ratio@$00$0DLJKMKAA@@std@@@23@@chrono@std@@@5@@Z",
    int32_t, // DataStatus
    null,
    NetworkConnection,
    CxxStringWrapper,
    NetworkHandler,
    VoidPointer, // std::shared_ptr<std::chrono::time_point>
)((conn, data, networkHandler, time_point) => {
    const address = conn.networkIdentifier.getAddress();
    const id = data.valueptr.getUint8();
    if (Warns[address] > 1 || id === MinecraftPacketIds.PurchaseReceipt) {
        conn.disconnect();
        return 1;
    }
    if (id === 0) {
        Warns[address] = Warns[address] ? Warns[address] + 1 : 1;
    }
    return receivePacket(conn, data, networkHandler, time_point);
});
events.networkDisconnected.on(ni => {
    Warns[ni.getAddress()] = 0;
});