import { Block } from "bdsx/bds/block";
import { BlockPos } from "bdsx/bds/blockpos";
import { MobEffectIds } from "bdsx/bds/effects";
import { ItemStack } from "bdsx/bds/inventory";
import { GameType, Player } from "bdsx/bds/player";
import { StaticPointer } from "bdsx/core";
import { events } from "bdsx/event";
import { float32_t, int32_t, void_t } from "bdsx/nativetype";
import { procHacker } from "bdsx/prochacker";
import { CIF } from "../main";

const getDestroySpeed = procHacker.js(
    "?getDestroySpeed@ItemStack@@QEBAMAEBVBlock@@@Z",
    float32_t,
    null,
    ItemStack,
    Block
);

const blockDestructionStop = procHacker.hooking(
    "?sendBlockDestructionStopped@BlockEventCoordinator@@QEAAXAEAVPlayer@@AEBVBlockPos@@H@Z",
    void_t,
    null,
    StaticPointer,
    Player,
    BlockPos,
    int32_t
)(onBlockDestructionStop);


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


function onBlockDestructionStop(blockEventCoordinator: StaticPointer, player: Player, blockPos: BlockPos, unknown: number): void {
    delete destroingBlock[player.getNameTag()];
    //console.log(`stop ${player.getNameTag()}`);
    return blockDestructionStop(blockEventCoordinator, player, blockPos, unknown);
};

const destroingBlock: { [keyof: string]: { pos: BlockPos, player: Player, time: number } } = {};


events.blockDestructionStart.on((ev) => {
    //console.log(`start ${ev.player.getNameTag()}`);
    destroingBlock[ev.player.getNameTag()] = { pos: ev.blockPos, player: ev.player, time: Date.now() };
});
events.blockDestroy.on((ev) => {
    ///console.log(`${allowInstabreak(ev.player,ev.blockSource.getBlock(ev.blockPos))}`);
    const gamemode = ev.player.getGameType();
    if (gamemode === GameType.Creative) {
        return;
    };
    const name = ev.player.getNameTag();
    if (destroingBlock[name] === undefined && !allowInstabreak(ev.player, ev.blockSource.getBlock(ev.blockPos))) {
        const ni = ev.player.getNetworkIdentifier();
        return CIF.detect(ni, "instabreak", "break block instantly");
    };
    //console.log(`done ${ev.player.getNameTag()}`);
    //if(destroingBlock[])
});

// ?getDestroySpeed@Player@@QEBAMAEBVBlock@@@Z
