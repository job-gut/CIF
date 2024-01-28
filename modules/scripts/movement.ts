import { AbilitiesIndex } from "bdsx/bds/abilities";
import { Actor, ActorType, DimensionId } from "bdsx/bds/actor";
import { Block, BlockActor } from "bdsx/bds/block";
import { BlockPos, Vec3 } from "bdsx/bds/blockpos";
import { ArmorSlot, ComplexInventoryTransaction } from "bdsx/bds/inventory";
import { Packet } from "bdsx/bds/packet";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { AnimatePacket, MovePlayerPacket, PlayerActionPacket, PlayerAuthInputPacket } from "bdsx/bds/packets";
import { GameType, Player, ServerPlayer } from "bdsx/bds/player";
import { events } from "bdsx/event";
import { bool_t, int32_t, void_t } from "bdsx/nativetype";
import { procHacker } from "bdsx/prochacker";
import { serverProperties } from "bdsx/serverproperties";
import { CIFconfig } from "../util/configManager";
import { CIF } from "../../main";
import { wasJoinedIn15seconds } from "./join";
import { MobEffectIds } from "bdsx/bds/effects";
import { bedrockServer } from "bdsx/launcher";
import { GameRuleId } from "bdsx/bds/gamerules";
import { AttributeId } from "bdsx/bds/attribute";
import { StringMappingType, parseIsolatedEntityName } from "typescript";


const UINTMAX = 0xffffffff;

export const MovementType =
	serverProperties["server-authoritative-movement"] === "client-auth"
		? MinecraftPacketIds.MovePlayer
		: MinecraftPacketIds.PlayerAuthInput;


/** @description returns nearest value if this array's length is shorter than 20*/
export const lastPositions: Record<string, { x: number, y: number, z: number }[]> = {};


const lastBPSForExportedFunc: Record<string, number> = {};


const lastBPS: Record<string, number> = {};

const isSpinAttacking: Record<string, boolean> = {};
const onGround: Record<string, boolean> = {};
const usedElytra: Record<string, boolean> = {};
const lastpos: Record<string, number[]> = {};
const jumpedTick: Record<string, number> = {};

const lastDeltaXZ: Record<string, number> = {};
const lastDeltaY: Record<string, number> = {};
const lastYaw: Record<string, number> = {};
const lastAccel: Record<string, number> = {};

const averageMaxBPS: Record<string, number> = {};
const averageActualBPS: Record<string, number> = {};
const averageStacks: Record<string, number> = {};

const airTicks: Record<string, number> = {};
const groundTicks: Record<string, number> = {};

const lagbackPos: Record<string, number[]> = {};

const hasTeleportedServerSidely: Record<string, boolean> = {};
const ticksAfterTeleport: Record<string, number> = {};

const isJoined: Record<string, boolean> = {};

const haveFished: Record<string, boolean> = {};
const isKnockbacked: Record<string, boolean> = {};
const damagedTime: Record<string, number> = {};
const pushedByPiston: Record<string, boolean> = {};

const lastDimension: Record<string, DimensionId> = {};

const isStartRiding: Record<string, boolean> = {};
const isStopRiding: Record<string, boolean> = {};

const respawnTick: Record<string, number> = {};

const PPS: Record<string, number> = {};
const TPS: Record<string, number> = {};

export const lastRotations = new Map<string, { x: number; y: number }[]>();

const lastMoveActorAndTick = new Map<string, { tick: number; x: number; z: number }>();

function appendRotationRecord(
	player: ServerPlayer,
	rotation: { x: number; y: number }
) {
	if (!player) return;

	const name = player.getName();
	const currentRotation = lastRotations.get(name);
	if (currentRotation === undefined) {
		lastRotations.set(name, [rotation]);
	} else {
		currentRotation.unshift(rotation);
		currentRotation.splice(3);
		lastRotations.set(name, currentRotation);
	}
};

declare module "bdsx/bds/block" {
	interface Block {
		/**
		 * Returns if mobs can be spawned on this block (Func from CIF)
		 */
		isSolid(): boolean;
	}
};

Block.prototype.isSolid = procHacker.js("?isSolid@Block@@QEBA_NXZ", bool_t, {
	this: Block,
});

declare module "bdsx/bds/player" {
	interface Player {
		/**
		 * Returns if player is on ices (Func from CIF)
		 */
		onIce(): boolean;

		/**
		 * Func from CIF
		 */
		isSpinAttacking(): boolean;

		/**
		 * Returns player's latest speed [Meters/Second] (Func from CIF)
		 */
		getLastBPS(): number;

		/**
		 * Returns if player is not on mid-air (Func from CIF)
		 * @description In client-auth, onGround May Results client-side OnGround
		 */
		onGround(): boolean;

		/**
		 * Func from CIF
		 */
		isGlidingWithElytra(): boolean;

		/**
		 * Returns if player is under any blocks (Func from CIF)
		 */
		isUnderAnyBlock(): boolean;

		/**
		 * Returns if player is on climbable blocks (Func from CIF)
		 */
		onClimbable(): boolean;

		/**
		 * Returns if player is on block that makes player falling slower (Func from CIF)
		 */
		onSlowFallingBlock(): boolean;
	}
};

Player.prototype.onIce = function () {
	const pos = BlockPos.create(this.getFeetPos());
	pos.y--;
	const blockName1 = this.getRegion().getBlock(pos).getName();

	pos.y--;
	const blockName2 = this.getRegion().getBlock(pos).getName();
	return blockName1.includes("ice") || blockName2.includes("ice");
};

Player.prototype.isUnderAnyBlock = function () {
	const pos = BlockPos.create(this.getPosition());

	pos.y++;
	const blockName1 = this.getRegion().getBlock(pos).getName();

	pos.y--;
	const blockName2 = this.getRegion().getBlock(pos).getName();
	return blockName1 !== "minecraft:air" || blockName2 !== "minecraft:air";
};

Player.prototype.isSpinAttacking = function () {
	const plname = this.getName();
	if (!isSpinAttacking[plname]) isSpinAttacking[plname] = false;
	return isSpinAttacking[plname];
};

Player.prototype.getLastBPS = function () {
	const plname = this.getName();
	if (!lastBPSForExportedFunc[plname]) lastBPSForExportedFunc[plname] = 0;
	return lastBPSForExportedFunc[plname];
};

Player.prototype.onGround = function () {
	const plname = this.getName();
	if (!onGround[plname]) onGround[plname] = false;
	return onGround[plname];
};

Player.prototype.isGlidingWithElytra = function () {
	const plname = this.getName();
	if (!usedElytra[plname]) usedElytra[plname] = false;
	return usedElytra[plname];
};

Player.prototype.onClimbable = function () {
	const player: ServerPlayer = this;

	const region = player.getRegion()!;

	const feetPos = player.getFeetPos();
	const headPos = player.getPosition();

	const currentPosBlock = region.getBlock(
		BlockPos.create(feetPos.x, feetPos.y, feetPos.z)
	);
	const currentUnderPosBlock = region.getBlock(
		BlockPos.create(feetPos.x, feetPos.y - 0.95, feetPos.z)
	);
	const currentHeadPosBlock = region.getBlock(
		BlockPos.create(headPos.x, headPos.y, headPos.z)
	);

	if (currentPosBlock.getName().includes("ladder")
		|| currentPosBlock.getName().includes("vine")
		|| currentPosBlock.getName().includes("powder_snow")
		|| currentHeadPosBlock.getName().includes("ladder")
		|| currentHeadPosBlock.getName().includes("vine")
		|| currentHeadPosBlock.getName().includes("powder_snow")
		|| currentUnderPosBlock.getName().includes("ladder")
		|| currentUnderPosBlock.getName().includes("vine")
		|| currentUnderPosBlock.getName().includes("powder_snow")
	) return true;

	return false;
};

Player.prototype.onSlowFallingBlock = function () {
	const player: ServerPlayer = this;

	const region = player.getRegion()!;

	const feetPos = player.getFeetPos();
	const headPos = player.getPosition();

	const currentPosBlock = region.getBlock(
		BlockPos.create(feetPos.x, feetPos.y, feetPos.z)
	);
	const currentHeadPosBlock = region.getBlock(
		BlockPos.create(headPos.x, headPos.y, headPos.z)
	);

	if (currentPosBlock.getName().includes("honey")
		|| currentPosBlock.getName().includes("web")
		|| currentHeadPosBlock.getName().includes("honey")
		|| currentHeadPosBlock.getName().includes("web")
	) return true;

	return false;
};

events.packetBefore(MinecraftPacketIds.MoveActorAbsolute).on(async (packet, netId, packetId) => {
    const flags = packet.flags;
    const x = packet.pos.x;
    const y = packet.pos.y;
    const z = packet.pos.z;

    // Entity-Fly

    const pos = BlockPos.allocate();
    pos.x = x;
    pos.y = y - 1;
    pos.z = z;

    let isInAir = true;

	for (let takeFromY = 0; takeFromY <= 1; takeFromY++){
		for (let addToX = -2; addToX <= 2; addToX++) {
			for (let addToZ = -2; addToZ <= 2; addToZ++) {
				const checkPos = BlockPos.allocate(pos);
				checkPos.x += addToX;
				checkPos.y -= takeFromY;
				checkPos.z += addToZ;
	
				const block = netId.getActor()!.getRegion().getBlock(checkPos);
				if (block.getName() != "minecraft:air") {
					isInAir = false;
					break;
				}
			}
		}
	}

    // FIXME: From my tests 249 is onGroung flag so it make sence here. Needs to be rewritten with normal flags
    if (flags == 249) {
        if (isInAir) {
            CIF.failAndFlag(netId, "EntityFly-A", "Sent OnGround flag being in air", 2);
        }
    }

    // Entity-Speed

    const player = netId.getActor()!;

    const last = lastMoveActorAndTick.get(player.getName());

    if (last) {
        const distance = Math.sqrt(Math.pow(x - last.x, 2) + Math.pow(z - last.z, 2));
        const ticks = Math.abs(player.getLevel().getCurrentTick() - last.tick);
        const BlocksPerTick = distance / ticks;

        if (BlocksPerTick != Infinity && BlocksPerTick > 1.5) {
            CIF.failAndFlag(netId, "EntitySpeed-A", "Moving faster than 1.5 blocks per tick", 2);
        }
    }

    lastMoveActorAndTick.set(player.getName(), { tick: player.getLevel().getCurrentTick(), x: x, z: z });
});

events.entityStopRiding.on(ev => {
    if (ev.entity.isPlayer()) {
		const pl = ev.entity;

		const plname = pl.getName();

        lastMoveActorAndTick.delete(plname);

		isStopRiding[plname] = true;

		setTimeout(() => {
			isStopRiding[plname] = false;
		}, 250);
    }
});

events.packetBefore(MinecraftPacketIds.PlayerAction).on(async (pkt, ni) => {
	const pl = ni.getActor()!;
	if (!pl) return;
	const plname = pl.getName();
	if (pkt.action === PlayerActionPacket.Actions.StartSpinAttack && pl.getMainhandSlot().getRawNameId().includes("trident")) {
		isSpinAttacking[plname] = true;
	} else if (pkt.action === PlayerActionPacket.Actions.StopSpinAttack) {
		setTimeout(() => {
			isSpinAttacking[plname] = false;
		}, 150);
	};
});

// class FishingHook extends Actor {
// }

// const getFishingTarget = procHacker.js("?getFishingTarget@FishingHook@@QEAAPEAVActor@@XZ", Actor, null, FishingHook);
// function onRetrieve(hook: FishingHook): number {
// 	const result = _onRetrieve(hook);
// 	if (result === 3) {
// 		const target = getFishingTarget(hook);
// 		if (target !== null && target.isPlayer()) {
// 			const name = target.getName();
// 			haveFished[name] = true;
// 			setTimeout(() => {
// 				haveFished[name] = false;
// 			}, 1000);
// 		}
// 	}
// 	return result;
// }
// const _onRetrieve = procHacker.hooking("?retrieve@FishingHook@@QEAAHXZ", int32_t, null, FishingHook)(onRetrieve);

const startGlide = procHacker.hooking(
	"?tryStartGliding@Player@@QEAA_NXZ",
	void_t,
	null,
	Player
)((player) => {
	usedElytra[player.getName()] = true;
	return startGlide(player);
});

const stopGlide = procHacker.hooking(
	"?stopGliding@Player@@QEAAXXZ",
	void_t,
	null,
	Player
)((player) => {
	setTimeout(() => {
		usedElytra[player.getName()] = false;
	}, 2000);
	return stopGlide(player);
});

// const pistonPush = procHacker.hooking(
// 	"?moveEntityLastProgress@PistonBlockActor@@QEAAXAEAVActor@@VVec3@@@Z",
// 	void_t,
// 	null,
// 	BlockActor,
// 	Actor,
// 	Vec3
// )((blockActor, actor, pos) => {
// 	if (actor.isPlayer()) {
// 		const name = actor.getName();
// 		pushedByPiston[name] = true;
// 		setTimeout(() => {
// 			pushedByPiston[name] = false;
// 		}, 250);
// 	};

// 	return pistonPush(blockActor, actor, pos);
// });

function setLastPositions(playerName: string, lastPosition: { x: number, y: number, z: number }): void {
	const currentValue = lastPositions[playerName];

	if (currentValue === undefined || currentValue.length !== 20) {
		const array: { x: number, y: number, z: number }[] = [];

		for (let i = 0; i < 20; i++) {
			array.push(lastPosition);
		};

		lastPositions[playerName] = array;
		return;
	};

	lastPositions[playerName] = lastPositions[playerName].splice(0, 19);
	lastPositions[playerName].unshift(lastPosition);
};


events.playerJump.on((ev) => {
	const pl = ev.player;
	const plname = pl.getName();

	const tick = pl.getLevel().getCurrentTick();

	// if (CIFconfig.Modules.movement) if (!pl.onGround() && !pl.isFlying() && pl.getGameType() !== GameType.Creative) CIF.detect(pl.getNetworkIdentifier(), "AirJump-B", "Jumps if player isn't on ground");

	jumpedTick[plname] = tick;
});


function lagback(pl: ServerPlayer): void {
	const plname = pl.getName();

	let lastposit = lastpos[plname];
	if (lagbackPos[plname]) lastposit = lagbackPos[plname];
	pl.runCommand(`tp ${lastposit[0]} ${lastposit[1]} ${lastposit[2]} ~ ~`);
};


events.packetAfter(MinecraftPacketIds.PlayerAuthInput).on(async (pkt, ni) => {
	const pl = ni.getActor();
	if (!pl) return;

	pl.syncAbilities();

	const plname = pl.getName();

	const currentTick = bedrockServer.level.getCurrentTick();

	const movePos = pkt.pos;
	movePos.y -= 2.37998962402343 - 0.759979248046875;

	if (typeof airTicks[plname] !== "number") airTicks[plname] = 0;
	if (typeof groundTicks[plname] !== "number") groundTicks[plname] = 0;
	if (typeof averageActualBPS[plname] !== "number") averageActualBPS[plname] = 0;
	if (typeof averageMaxBPS[plname] !== "number") averageMaxBPS[plname] = 0;
	if (typeof averageStacks[plname] !== "number") averageStacks[plname] = 0;
	if (typeof ticksAfterTeleport[plname] !== "number") ticksAfterTeleport[plname] = 0;

	if (typeof PPS[plname] !== "number") PPS[plname] = 0;
	if (isNaN(PPS[plname])) PPS[plname] = 0;

	if (isJoined[plname]) PPS[plname]++;

	const region = pl.getRegion()!;

	let actualOnGround = false;


	if (region.getBlock(BlockPos.create(movePos.x - 0.299, movePos.y - 0.1, movePos.z - 0.299)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x - 0.299, movePos.y - 0.1, movePos.z + 0.299)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x + 0.299, movePos.y - 0.1, movePos.z + 0.299)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x + 0.299, movePos.y - 0.1, movePos.z - 0.299)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x, movePos.y - 0.1, movePos.z)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x - 0.299, movePos.y - 0.1, movePos.z)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x, movePos.y - 0.1, movePos.z + 0.299)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x + 0.299, movePos.y - 0.1, movePos.z)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x, movePos.y - 0.1, movePos.z - 0.299)).getName() !== "minecraft:air") {
		actualOnGround = true;
	};

	if (region.getBlock(BlockPos.create(movePos.x - 0.299, movePos.y - 0.51, movePos.z - 0.299)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x - 0.299, movePos.y - 0.51, movePos.z + 0.299)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x + 0.299, movePos.y - 0.51, movePos.z + 0.299)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x + 0.299, movePos.y - 0.51, movePos.z - 0.299)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x, movePos.y - 0.51, movePos.z)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x - 0.299, movePos.y - 0.51, movePos.z)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x, movePos.y - 0.51, movePos.z + 0.299)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x + 0.299, movePos.y - 0.51, movePos.z)).getName() !== "minecraft:air" ||
		region.getBlock(BlockPos.create(movePos.x, movePos.y - 0.51, movePos.z - 0.299)).getName() !== "minecraft:air") {
		actualOnGround = true;
	};

	const og = actualOnGround;

	onGround[plname] = og;

	if (pl.onClimbable() || pl.onSlowFallingBlock() || pl.isInWater()) onGround[plname] = true;

	if (pl.onGround()) {
		airTicks[plname] = 0;
		groundTicks[plname]++;
	} else {
		airTicks[plname]++;
		groundTicks[plname] = 0;
	};

	if (!lastpos[plname]) lastpos[plname] = [movePos.x, movePos.y, movePos.z];

	const rotation = {
		x: pkt.headYaw,
		y: pkt.pitch,
	};

	appendRotationRecord(pl, rotation);

	const deltaXZ = Math.sqrt(pkt.delta.x ** 2 + pkt.delta.z ** 2);
	const ZXlastDelta = lastDeltaXZ[plname];

	const YlastDelta = lastDeltaY[plname];

	const yaw = pkt.yaw;
	const deltaYaw = Math.abs(yaw - lastYaw[plname]);

	const accel = deltaXZ - ZXlastDelta;
	const AbsSquaredAccel = Math.abs(accel) * 100;
	const squaredLastAccel = lastAccel[plname] * 100;

	const prediction = ZXlastDelta * 0.91;
	const predDiff = deltaXZ - prediction - 0.024;

	const deltaY = pkt.delta.y + 0.07840000092983246;

	const accelY = deltaY - YlastDelta;

	const maxBPS = pl.getSpeed() * 43.5;
	const maxJumpBPS = pl.getSpeed() * 107;

	const ActualBPS = ZXlastDelta * 36.65;

	const isTeleported = pkt.getInput(PlayerAuthInputPacket.InputData.HandledTeleport);

	const isJumping = pkt.getInput(PlayerAuthInputPacket.InputData.Jumping);
	const isPressingJump = pkt.getInput(PlayerAuthInputPacket.InputData.JumpDown);
	const wantJump = pkt.getInput(PlayerAuthInputPacket.InputData.WantUp);

	const isStartJump = pkt.getInput(PlayerAuthInputPacket.InputData.StartJumping);

	const playerPing = bedrockServer.rakPeer.GetLastPing(ni.address);

	const plRespawnPos = pl.getSpawnPosition();

	const nearBoat = pl.fetchNearbyActorsSorted(Vec3.create(1, 1, 1), ActorType.BoatRideable);

	if (hasTeleportedServerSidely[plname] === true && !isTeleported) ticksAfterTeleport[plname]++;
	else {
		ticksAfterTeleport[plname] = 0;
		hasTeleportedServerSidely[plname] = false
	};

	const realBPS = Math.sqrt((movePos.x - lastpos[plname][0]) ** 2 + (movePos.z - lastpos[plname][2]) ** 2) * 20;

	if (groundTicks[plname] > 4 && !isStartJump && !isJumping) {
		averageStacks[plname]++;

		if (averageStacks[plname] > 0) {
			averageMaxBPS[plname] += maxBPS;
			averageActualBPS[plname] += ActualBPS;
		};
	} else {
		averageMaxBPS[plname] = 0;
		averageActualBPS[plname] = 0;
		averageStacks[plname] = -5;
	};

	let cancelled = false;

	if (CIFconfig.Modules.movement) {

		if ((pl.getGameType() === GameType.Survival || pl.getGameType() === GameType.Adventure) && isJoined[plname] && !isTeleported) {


			//AUTOJUMP


			// if (isStartJump && !(isPressingJump || wantJump)) {
			// 	CIF.failAndFlag(ni, "Auto-Jump", "Jumps without pressing jump key", 2);

			// 	lagback(pl);
			// 	cancelled = true;
			// };


			if (!pl.getAbilities().getAbility(AbilitiesIndex.MayFly).getBool() &&
				!pl.getAbilities().getAbility(AbilitiesIndex.Flying).getBool()
				&& !pl.isFlying()
				&& !pl.isGlidingWithElytra() && !pl.isSpinAttacking()) {


				//DISABLER


				if ((pkt.getInput(PlayerAuthInputPacket.InputData.Up) ||
					pkt.getInput(PlayerAuthInputPacket.InputData.Left) ||
					pkt.getInput(PlayerAuthInputPacket.InputData.Right) ||
					pkt.getInput(PlayerAuthInputPacket.InputData.Down)) && !isTeleported && deltaXZ === 0 && ZXlastDelta === 0
					&& realBPS > 3) {
					CIF.failAndFlag(ni, "Disabler-A", "No DeltaXZ while pressing key", 5);

					lagback(pl);
					cancelled = true;
				};


				if (ticksAfterTeleport[plname] > Math.ceil(playerPing / 50 * 2) + 2) {
					CIF.failAndFlag(ni, "Disabler-B", "No teleport receive", 5);

					lagback(pl);
					cancelled = true;
				};


				//SPEED


				if (!pl.onClimbable()) {
					if (averageStacks[plname] >= 4) {
						const avrMaxBPS = averageMaxBPS[plname] / averageStacks[plname];
						const avrActualBPS = averageActualBPS[plname] / averageStacks[plname];

						averageMaxBPS[plname] = 0;
						averageActualBPS[plname] = 0;
						averageStacks[plname] = 0;

						if (avrActualBPS - avrMaxBPS > 0.9 && pl.onGround() && groundTicks[plname] > 4 && !isKnockbacked[plname] && !pl.onIce()) {
							CIF.failAndFlag(ni, "Speed-A", `Vanilla increased Speed`, 3);

							lagback(pl);
							cancelled = true;
						};
					};

					if (ActualBPS > maxJumpBPS && maxJumpBPS > 0 && squaredLastAccel >= 6 && !isKnockbacked[plname] && !pl.onIce()) {
						CIF.failAndFlag(ni, "Speed-B", `Too Fast | BPS: ${ActualBPS.toFixed(2)}`, 3);

						lagback(pl);
						cancelled = true;
					};

					if (deltaYaw > 1.5 && deltaXZ > .150 && AbsSquaredAccel < 1.0E-5) {
						CIF.failAndFlag(ni, "Speed-E", `Invalid deceleration while turning around [Strafe]`, 3);

						lagback(pl);
						cancelled = true;
					};

					// if (predDiff > 0 && airTicks[plname] > 2 && !isKnockbacked[plname] &&!actualOnGround) {
					// 	CIF.failAndFlag(ni, `Speed-F`, `Invalid deceleration while being in air`, 3);

					// 	let lastposit = lastpos[plname];
					// 	if (lagbackPos[plname]) lastposit = lagbackPos[plname];
					// 	pl.runCommand(`tp ${lastposit[0]} ${lastposit[1]} ${lastposit[2]}`);
					// 	cancelled = true;
					// };
				};


				// TP


				if (((realBPS / 20 > deltaXZ * 5 && realBPS / 20 >= .9 && !isKnockbacked[plname]) || realBPS / 20 > 4) && !isTeleported
					&& movePos.distance(plRespawnPos) > 1.75 && !pushedByPiston[plname] && lastDimension[plname] === pl.getDimensionId()
					&& (!respawnTick[plname] || currentTick - respawnTick[plname] > 19)
					&& !isStartRiding[plname] && !isStopRiding[plname]) {
					CIF.suspect(ni, "Teleport", `Moved too fast in 1 tick`);

					lagback(pl);
					cancelled = true;
				};


				// FLY


				if (!pl.isRiding() && !pl.isInLava() && !pl.isInWater() && !pl.isInScaffolding() && !pl.isInSnow() && !pl.onClimbable() && !pl.onSlowFallingBlock() &&
					!pl.hasEffect(MobEffectIds.Levitation) && !pl.hasEffect(MobEffectIds.JumpBoost) && !isTeleported && isJoined[plname] && !pl.onGround() && movePos.y > -100) {

					if (airTicks[plname] > 2 && deltaY < 0 && accelY === 0) {
						CIF.failAndFlag(ni, "Fly-A", `Glides constantly`, 3);

						lagback(pl);

						cancelled = true;
					};

					// if (airTicks[plname] > 29 && !pl.onGround() && deltaY < 0 && accelY < 0 && deltaY > -0.5 && !isKnockbacked[plname]) {
					// 	CIF.failAndFlag(ni, "Fly-D", `Glides less, less`, 3);

					// 	let lastposit = lastpos[plname];
					// 	if (lagbackPos[plname]) lastposit = lagbackPos[plname];
					// 	pl.runCommand(`tp ${lastposit[0]} ~ ${lastposit[2]}`);

					// 	cancelled = true;
					// };

					if (airTicks[plname] > 4 && deltaY > 0 && accelY === 0 && !isStartJump) {
						CIF.failAndFlag(ni, "Fly-C", `Flew up constantly`, 5);

						lagback(pl);

						cancelled = true;
					};



					if (!pl.hasEffect(MobEffectIds.SlowFalling)) {
						if (airTicks[plname] > 19 && deltaY > -0.5 && deltaY < 0 && !isKnockbacked[plname]) {
							CIF.failAndFlag(ni, "Fly-E", `Glides too slowly`, 3);

							lagback(pl);

							cancelled = true;
						};
					};


					if (deltaY === 0 && deltaXZ > 0 && accelY === 0 && airTicks[plname] > 4 && nearBoat.length < 1) {
						CIF.failAndFlag(ni, "Fly-B", `No Y changes in mid-air`, 3);

						lagback(pl);

						cancelled = true;
					};


					if (airTicks[plname] > 9 && deltaY > 0 && !isKnockbacked[plname] && accelY > 0 && nearBoat.length < 1) {
						CIF.failAndFlag(ni, `Fly-F`, `Y boost in mid-air`, 3);

						lagback(pl);

						cancelled = true;
					};

					if (airTicks[plname] > 19 && deltaY > 0 && pkt.pos.y - lagbackPos[plname][1] > 2.5 && nearBoat.length < 1) {
						CIF.failAndFlag(ni, `Fly-G`, `Too high Y position from the last ground`, 2);

						lagback(pl);

						cancelled = true;
					};


					//High Jump


					// if (deltaY > 0.412 && accelY > 0.25 && isJoined[plname] && isJumping) {
					// 	CIF.failAndFlag(ni, "HighJump", `Jumps too POWERFUL`, 2);

					// 	lagback(pl);

					// 	cancelled = true;
					// };
				};

			};

		};

	};

	if (pl.onGround()) {
		lagbackPos[plname] = [movePos.x, movePos.y, movePos.z];
	};

	lastDeltaXZ[plname] = deltaXZ;
	lastDeltaY[plname] = deltaY;

	lastBPSForExportedFunc[plname] = ActualBPS;

	lastDimension[plname] = pl.getDimensionId();

	if (!cancelled) {
		lastpos[plname] = [movePos.x, movePos.y, movePos.z];
		setLastPositions(plname, { x: movePos.x, y: movePos.y, z: movePos.z });
		lastAccel[plname] = accel;
	} else {
		lastpos[plname] = lastpos[plname];
		lastAccel[plname] = lastAccel[plname];
		setLastPositions(plname, { x: lastpos[plname][0], y: lastpos[plname][1], z: lastpos[plname][2] });
	};

	movePos.y += 2.37998962402343 - 0.759979248046875;
	lastYaw[plname] = yaw;
});

const hasTeleport = procHacker.hooking(
	"?teleportTo@Player@@UEAAXAEBVVec3@@_NHH1@Z",
	void_t,
	null,
	ServerPlayer,
	Vec3
)((pl, pos) => {
	const plname = pl.getName()!;

	hasTeleportedServerSidely[plname] = true;
	ticksAfterTeleport[plname] = 0;

	return hasTeleport(pl, pos);
});

events.entityKnockback.on((ev) => {
	if (!ev.target.isPlayer()) return;

	const pl = ev.target as ServerPlayer;
	const plname = pl.getName();
	isKnockbacked[plname] = true;
	damagedTime[plname] = Date.now();
	setTimeout(() => {
		const now = Date.now();
		if (now - damagedTime[plname] > 550) isKnockbacked[plname] = false;
	}, 750);

	airTicks[plname] = 0;
});

// events.fallOnBlock.on((ev)=> {
// 	const pl = ev.entity;

// 	if (!pl.isPlayer()) return;

// 	const plname = pl.getName();

// 	if (ev.block.getName() !== "minecraft:air") airTicks[plname] = 0;
// });

events.playerJoin.on((ev) => {
	const pl = ev.player;
	const plname = pl.getName();

	setTimeout(() => {
		isJoined[plname] = true;
	}, 2000);
});

events.networkDisconnected.on((ni) => {
	const pl = ni.getActor();
	if (!pl) return;

	const plname = pl.getName();

	setTimeout(() => {
		isJoined[plname] = false;
	}, 1000);
});

events.packetSend(MinecraftPacketIds.Disconnect).on(async (pkt, ni) => {
	const pl = ni.getActor();
	if (!pl) return;

	const plname = pl.getName();

	setTimeout(() => {
		isJoined[plname] = false;
	}, 1000);
});

events.levelTick.on(async (ev) => {
	for (const pl of ev.level.getPlayers()) {
		const plname = pl.getName();
		InventoryTransactionPerTick[plname] = 0;
    
		// if (typeof TPS[plname] !== "number") TPS[plname] = 0;

		// if (isJoined[plname] && !CIF.wasDetected[plname]) TPS[plname]++;

		// if (TPS[plname] === 20 && !CIF.wasDetected[plname]) {

		// 	if (PPS[plname] < -80) {
		// 		PPS[plname] = -80;
		// 	};

		// 	if (PPS[plname] > 26) {
		// 		CIF.detect(pl.getNetworkIdentifier(), "Timer", "Fast Ticking");

		// 		PPS[plname] = 20;
		// 	};

		// 	PPS[plname] -= 20;

		// 	TPS[plname] -= 20;
		// };
	};
});

events.playerRespawn.on((ev)=> {
	const pl = ev.player;
	const plname = pl.getName();

	PPS[plname] = 0;
	respawnTick[plname] = bedrockServer.level.getCurrentTick();
});

const InventoryTransactionPerTick: Record<string, number> = {};

events.packetRaw(MinecraftPacketIds.InventoryTransaction).on((ptr, size, ni)=> {
	if (CIFconfig.Modules.crasher !== true) return;

	const pl = ni.getActor()!;
    const plname = pl.getName()!;

	InventoryTransactionPerTick[plname] = InventoryTransactionPerTick[plname] ? InventoryTransactionPerTick[plname] + 1 : 1;

	if (InventoryTransactionPerTick[plname] > 99) {
		CIF.ban(ni, "Crasher-S");
		return CIF.detect(ni, "Crasher-S", "Crasher that made by Suni [Auto Clicker]");
	};
});

events.entityStartRiding.on(async (ev)=> {
	const pl = ev.entity;
	if (!pl.isPlayer()) return;

	const plname = pl.getName();

	isStartRiding[plname] = true;
	setTimeout(() => {
		isStartRiding[plname] = false;
	}, 250);
});


// events.playerRespawn.on((ev) => {
// 	const pl = ev.player;
// 	const plname = pl.getName();

// 	const x = pl.getFeetPos().x;
// 	const y = pl.getFeetPos().y;
// 	const z = pl.getFeetPos().z;

// 	isRespawned[plname] = true;
// 	respawnedPos[plname] = Vec3.create(pl.getFeetPos());
// 	lastpos[plname] = [x, y, z];
// 	setTimeout(() => {
// 		isRespawned[plname] = false;
// 		respawnedPos[plname] = Vec3.create({ x: 99999, y: 99999, z: 99999 });
// 	}, 2500);
// });