import { BlockPos } from "bdsx/bds/blockpos";
import { ServerPlayer, Player } from "bdsx/bds/player";
import { StaticPointer } from "bdsx/core";
import { decay } from "bdsx/decay";
import { Event } from "bdsx/eventtarget";
import { uint8_t, void_t } from "bdsx/nativetype";
import { procHacker } from "bdsx/prochacker";

class BlockDestructionStopEvent {
	constructor(public player: ServerPlayer, public blockPos: BlockPos){};
};

export const blockDestructionStop = new Event<(event: BlockDestructionStopEvent) => void>();

function onBlockDestructionStop(blockEventCoordinator: StaticPointer, player: Player, blockPos: BlockPos, v: uint8_t): void {
    const event = new BlockDestructionStopEvent(player, blockPos);
    blockDestructionStop.fire(event);
    decay(blockPos);
    return _onBlockDestructionStop(blockEventCoordinator, event.player, event.blockPos, v);
};

const _onBlockDestructionStop = procHacker.hooking(
    "?sendBlockDestructionStopped@BlockEventCoordinator@@QEAAXAEAVPlayer@@AEBVBlockPos@@H@Z",
    void_t,
    null,
    StaticPointer,
    Player,
    BlockPos,
    uint8_t,
)(onBlockDestructionStop);

