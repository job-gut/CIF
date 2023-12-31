import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { CIF } from "../../main";
import { CIFconfig } from "../util/configManager";
import { CANCEL } from "bdsx/common";
import { wasJoinedIn15seconds } from "./join";
import { bedrockServer } from "bdsx/launcher";

const PPSsound: Record<string, number> = {};
const PPSact: Record<string, number> = {};

const spamStack: Record<string, number> = {};

events.packetBefore(MinecraftPacketIds.LevelSoundEvent).on((pkt, ni) => {
    const sound = pkt.sound;

	if (pkt.extraData === -1 && !pkt.entityType === !wasJoinedIn15seconds.get(ni)) {
		return CIF.suspect(ni, "SwingSound", "Illegal Sound on Swing Motion");
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

events.packetBefore(MinecraftPacketIds.CommandRequest).on((pkt, ni)=> {
	const command = pkt.command;
	const pl = ni.getActor()!;
	const plname = pl.getName();
	if (command.includes("execute") && pl.getCommandPermissionLevel() > 0) return;

	const countOfAllEntitys = command.split("@e").length - 1;
	const countOfAllPlayers = command.split("@a").length - 1;
	const countOfRandomPlayers = command.split("@r").length - 1;
	const countOfNearbyPlayers = command.split("@p").length - 1;

	if (countOfAllEntitys > 2 ||
	countOfAllPlayers > 2 ||
	countOfRandomPlayers > 2 ||
	countOfNearbyPlayers > 2
		) {
		if (typeof spamStack[plname] !== "number") spamStack[plname] = 0;

		spamStack[plname]++;

		if (spamStack[plname] > 2) {
			CIF.detect(ni, "Spammer", "Suspected as a command spammer");
			bedrockServer.serverInstance.disconnectClient(ni, "§cDo not try spamming!");
			
			return CANCEL;
		};

		// pl.sendMessage(`§c도배를 시도하지 마세요!\n앞으로 §e${3-spamStack[plname]} §c번 시도시 추방됩니다`);
		pl.sendMessage(`§cDo not try spamming!\n§e${3-spamStack[plname]} §ctimes remain to get kicked`);
		pl.playSound("random.orb");

		return CANCEL;
	};
});