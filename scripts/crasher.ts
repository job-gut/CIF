import { NetworkConnection, NetworkHandler, NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { VoidPointer } from "bdsx/core";
import { events } from "bdsx/event";
import { int32_t } from "bdsx/nativetype";
import { CxxStringWrapper } from "bdsx/pointer";
import { procHacker } from "bdsx/prochacker";
import { CIF } from "../main";

const UINTMAX = 0xffffffff;

const PPSsound: Record<string, number> = {};
const PPSact: Record<string, number> = {};

const isFirstSkinPacket = new Map<NetworkIdentifier, boolean>();

events.packetBefore(MinecraftPacketIds.MovePlayer).on((pkt, ni) => {
    if (pkt.pos.x > UINTMAX || pkt.pos.y > UINTMAX || pkt.pos.z > UINTMAX) {
        CIF.ban(ni, "crasher");
        return CIF.detect(ni, "crasher", "Illegal Position");
    };

    if (isNaN(pkt.pitch) || isNaN(pkt.yaw)) {
        CIF.ban(ni, "Crasher");
        return CIF.detect(ni, "crasher", "Illegal Head Pos");
    };
});

events.packetBefore(MinecraftPacketIds.PlayerAuthInput).on((pkt, ni) => {
    if (pkt.pos.x > UINTMAX || pkt.pos.y > UINTMAX || pkt.pos.z > UINTMAX || pkt.moveX > UINTMAX || pkt.moveZ > UINTMAX) {
        CIF.ban(ni, "crasher");
        return CIF.detect(ni, "crasher", "Illegal Position");
    };

    if (isNaN(pkt.pitch) || isNaN(pkt.yaw)) {
        CIF.ban(ni, "Crasher");
        return CIF.detect(ni, "crasher", "Illegal Head Pos");
    };
});


events.packetRaw(MinecraftPacketIds.ClientCacheBlobStatus).on((ptr, size, ni) => {
    if (ptr.readVarUint() >= 0xfff || ptr.readVarUint() >= 0xfff) {
        CIF.ban(ni, "DoS");
        return CIF.detect(ni, "DoS", "DoS using ClientCacheBlobStatus Packet");
    };
});


events.packetBefore(123).on((pkt, ni) => {
    const sound = pkt.sound;
    if (sound === 0) {
        CIF.ban(ni, "crasher");
        return CIF.detect(ni, "crasher", "Invalid LevelSoundPacket");
    };

    if (sound !== 42 && sound !== 43) {
        const pl = ni.getActor()!;
        const plname = pl.getName()!;
        PPSsound[plname] = PPSsound[plname] ? PPSsound[plname] + 1 : 1;

        if (PPSsound[plname] > 39) {
            PPSsound[plname] = 0;
            return CIF.detect(ni, "Sound Spam", "Spamming Sound Packets");
        };

        setTimeout(async () => {
            PPSsound[plname]--;
        }, (1000));
    };
});

events.packetBefore(MinecraftPacketIds.ActorEvent).on((pkt, ni) => {
    const pl = ni.getActor()!;
    const plname = pl.getName()!;
    PPSact[plname] = PPSact[plname] ? PPSact[plname] + 1 : 1;

    if (PPSact[plname] > 39) {
        PPSact[plname] = 0;
        return CIF.detect(ni, "Act Spam", "Spamming ActorEvent Packets");
    };
    setTimeout(async () => {
        PPSact[plname]--;
    }, (1000));
});

events.packetRaw(93).on((ptr, size, ni) => {
    const pl = ni.getActor()!;
    if (!pl) return CANCEL;

    if (pl.hasTag("CIFcanCrash")) return;

    if (isFirstSkinPacket.get(ni)) {
        pl.sendMessage("§l§c스킨을 적용하시려면 서버에 재접속 해주세요!");
        pl.playSound("random.break");
        return CANCEL;
    };

    isFirstSkinPacket.set(ni, true);
});

const Warns: Record<string, number> = {};
const ipBlocked: Record<string, boolean> = {};

const receivePacket = procHacker.hooking(
    "?receivePacket@NetworkConnection@@QEAA?AW4DataStatus@NetworkPeer@@AEAV?$basic_string@DU?$char_traits@D@std@@V?$allocator@D@2@@std@@AEAVNetworkHandler@@AEBV?$shared_ptr@V?$time_point@Usteady_clock@chrono@std@@V?$duration@_JU?$ratio@$00$0DLJKMKAA@@std@@@23@@chrono@std@@@5@@Z",
    int32_t,
    null,
    NetworkConnection,
    CxxStringWrapper,
    NetworkHandler,
    VoidPointer,
)((conn, data, networkHandler, time_point) => {
    const address = conn.networkIdentifier.getAddress();
    const ip = address.split("|")[0];

    if (ip === "10.10.10.10") return receivePacket(conn, data, networkHandler, time_point);

    if (ipBlocked[ip]) {
        conn.disconnect();
        CIF.announce(`§c[§fCIF§c] §c${ip} §6tried to connect §c(IP Blocked)`);
        CIF.log(`${ip} tried to connect (IP Blocked)`);
        return 1;
    };

    const id = data.valueptr.getUint8();
    if (Warns[address] > 3 || id === MinecraftPacketIds.PurchaseReceipt) {
        conn.disconnect();
        ipBlocked[ip] = true;
        CIF.ipDetect(conn.networkIdentifier, "crasher", "CVE: Send Invalid Packets without Minecraft Connection");
        return 1;
    };

    if (id === 0) {
        Warns[address] = Warns[address] ? Warns[address] + 1 : 1;
    };

    //Block All Packets from Detected Player
    if (conn.networkIdentifier.getActor()) {
        const plname = conn.networkIdentifier.getActor()!.getName();
        if (CIF.wasDetected[plname] === true) {
            conn.disconnect();
            return 1;
        };
    };

    return receivePacket(conn, data, networkHandler, time_point);
});

events.networkDisconnected.on(ni => {
    if (ni) {
        Warns[ni.getAddress()] = 0;
        CIF.resetDetected(ni.getActor()?.getName()!);
    };
});