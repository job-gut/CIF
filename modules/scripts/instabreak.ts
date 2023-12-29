import { Block } from "bdsx/bds/block";
import { MobEffectIds } from "bdsx/bds/effects";
import { ItemStack } from "bdsx/bds/inventory";
import { GameType, Player, ServerPlayer } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { bedrockServer } from "bdsx/launcher";
import { float32_t, uint8_t, void_t } from "bdsx/nativetype";
import { procHacker } from "bdsx/prochacker";
import { CIF } from "../../main";

import { CIFconfig } from "../util/configManager";
import { BlockPos } from "bdsx/bds/blockpos";
import { StaticPointer } from "bdsx/core";
import { decay } from "bdsx/decay";
import { BlockDestructionStartEvent } from "bdsx/event_impl/blockevent";
import { Event } from "bdsx/eventtarget";
import { blockDestructionStop } from "../util/EventListener";

const destructionstarttick: Record<string, number | null | undefined> = {};
const getDestroySpeed = procHacker.js(
	"?getDestroySpeed@ItemStack@@QEBAMAEBVBlock@@@Z",
	float32_t,
	null,
	ItemStack,
	Block
);

function allowInstabreak(player: Player, block: Block): boolean {
	const haste = player.getEffect(MobEffectIds.Haste);
	let hasteLevel = 0;
	if (haste !== null) {
		hasteLevel = haste.amplifier;
	};
	const destroyTime = block.getDestroySpeed();
	const destroySpeed = getDestroySpeed(player.getMainhandSlot(), block);
	const realDestroyTime =
		destroyTime / (destroySpeed * (1 + 0.2 * hasteLevel));
	return realDestroyTime <= 0.7;
};

events.blockDestructionStart.on(async (ev) => {
	if (CIFconfig.Modules.instabreak !== true) return;

	const now = Date.now();
	const pl = ev.player!;
	const plname = pl.getNameTag();
	if (destructionstarttick !== null) destructionstarttick[plname] = now;
});

blockDestructionStop.on(async(ev)=> {
	const pl = ev.player!;
	const plname = pl.getNameTag();
	if (destructionstarttick !== null) destructionstarttick[plname] = undefined;
});

events.blockDestroy.on((ev) => {
	if (CIFconfig.Modules.instabreak !== true) return;


	const currenttick = Date.now();

	const player = ev.player;

	const gamemode = player.getGameType();
	if (gamemode === GameType.Creative) {
		return;
	};

	const block = ev.blockSource.getBlock(ev.blockPos);
	const blockName = block.getName();
	if (blockName === "minecraft:fire") {
		CIF.ban(player.getNetworkIdentifier(), "Extinguisher");
		CIF.detect(player.getNetworkIdentifier(), "Extinguisher", "Destroy Fire Block");
	};

	const name = player.getName();

	if (typeof destructionstarttick[name] !== "number" && !allowInstabreak(player, block)) {
		destructionstarttick[name] = null;
		return CIF.failAndFlag(player.getNetworkIdentifier(), "Instabreak-A", "No destruction start", 3);
	};
	
	if (
		currenttick - destructionstarttick[name]! < 70 &&
		!allowInstabreak(player, block)
	) {
		destructionstarttick[name] = null;
		return CIF.failAndFlag(player.getNetworkIdentifier(), "Instabreak-B", "Breaks block instantly", 3);
	};

	destructionstarttick[name] = undefined;
});