import { Block } from "bdsx/bds/block";
import { MobEffectIds } from "bdsx/bds/effects";
import { ItemStack } from "bdsx/bds/inventory";
import { GameType, Player, ServerPlayer } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { bedrockServer } from "bdsx/launcher";
import { float32_t } from "bdsx/nativetype";
import { procHacker } from "bdsx/prochacker";
import { CIF } from "../main";

const destructionstarttick: Record<string, number> = {};


const getDestroySpeed = procHacker.js(
    "?getDestroySpeed@ItemStack@@QEBAMAEBVBlock@@@Z",
    float32_t,
    null,
    ItemStack,
    Block
);

// const blockDestructionStop = procHacker.hooking(
//     "?sendBlockDestructionStopped@BlockEventCoordinator@@QEAAXAEAVPlayer@@AEBVBlockPos@@H@Z",
//     void_t,
//     null,
//     StaticPointer,
//     Player,
//     BlockPos,
//     int32_t
// )(onBlockDestructionStop);


function allowInstabreak(player: Player, block: Block): boolean {
    const haste = player.getEffect(MobEffectIds.Haste);
    let hasteLevel = 0;
    if (haste !== null) {
        hasteLevel = haste.amplifier;
    };
    const destroyTime = block.getDestroySpeed();
    const destroySpeed = getDestroySpeed(player.getMainhandSlot(), block);
    const realDestroyTime = destroyTime / (destroySpeed * (1 + (0.2 * hasteLevel)));
    return realDestroyTime < 0.05;
};


// function onBlockDestructionStop(blockEventCoordinator: StaticPointer, player: Player, blockPos: BlockPos, unknown: number): void {
//     delete destroingBlock[player.getName()];
//     //console.log(`stop ${player.getName()}`);
//     return blockDestructionStop(blockEventCoordinator, player, blockPos, unknown);
// };

// const destroingBlock: { [keyof: string]: { pos: BlockPos, player: Player, time: number } } = {};


// events.blockDestructionStart.on((ev) => {
//     //console.log(`start ${ev.player.getName()}`);
//     destroingBlock[ev.player.getName()] = { pos: ev.blockPos, player: ev.player, time: Date.now() };
// });

events.attackBlock.on(async (ev) => {
    const now = bedrockServer.level.getCurrentTick();
    const pl = ev.player!;
    const plname = pl.getNameTag();
    destructionstarttick[plname] = now;
});

events.blockDestroy.on((ev) => {
    const currenttick = bedrockServer.level.getCurrentTick();

    const player = ev.player;

    const gamemode = player.getGameType();
    if (gamemode === GameType.Creative) {
        return;
    };

    const name = player.getName();
    if (currenttick - destructionstarttick[name] < 1 && !allowInstabreak(player, ev.blockSource.getBlock(ev.blockPos))) {
        return instabreakWarn(player);
    };
});

const instabreakwarn: Record<string, number> = {};

function instabreakWarn(player: ServerPlayer): CANCEL {

    const playerName = player.getName()!;
    instabreakwarn[playerName] = instabreakwarn[playerName] ? instabreakwarn[playerName] + 1 : 1;

    if (instabreakwarn[playerName] > 1) {
        const ni = player.getNetworkIdentifier()
        CIF.ban(ni, "Instabreak");
        CIF.detect(ni, "instabreak", "Break block instantly");
        instabreakwarn[playerName] = 0;
    };

    setTimeout(() => {
        instabreakwarn[playerName]--;
        if (instabreakwarn[playerName] < 0) {
            instabreakwarn[playerName] = 0;
        };
    }, 5000);

    return CANCEL;
};