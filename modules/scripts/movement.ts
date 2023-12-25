import { AbilitiesIndex } from "bdsx/bds/abilities";
import { Actor } from "bdsx/bds/actor";
import { Block, BlockActor } from "bdsx/bds/block";
import { BlockPos, Vec3 } from "bdsx/bds/blockpos";
import { ArmorSlot } from "bdsx/bds/inventory";
import { Packet } from "bdsx/bds/packet";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { MovePlayerPacket, PlayerActionPacket, PlayerAuthInputPacket } from "bdsx/bds/packets";
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

const UINTMAX = 0xffffffff;

export const MovementType =
	serverProperties["server-authoritative-movement"] === "client-auth"
		? MinecraftPacketIds.MovePlayer
		: MinecraftPacketIds.PlayerAuthInput;


/** @description returns nearest value if this array's length is shorter than 20*/
export const lastPositions: Record<string, { x: number, y: number, z: number }[]> = {};


const lastBPSForExportedFunc: Record<string, number> = {};


const strafestack: Record<string, number> = {};
const tooFastStack: Record<string, number> = {};
const littleFastStack: Record<string, number> = {};
const littleFastWarn: Record<string, number> = {};
const lastWentUpBlocks: Record<string, number> = {};

const Fly_bStack: Record<string, number> = {};
const Fly_c1Stack: Record<string, number> = {};
const Fly_c2Stack: Record<string, number> = {};

const lastBPS: Record<string, number> = {};

const isSpinAttacking: Record<string, boolean> = {};
const onGround: Record<string, boolean> = {};
const usedElytra: Record<string, boolean> = {};
const lastpos: Record<string, number[]> = {};
const jumpedTick: Record<string, number> = {};

const lastDeltaXZ: Record<string, number> = {};
const lastDeltaY: Record<string, number> = {};
const lastYaw: Record<string, number> = {};

const airTicks: Record<string, number> = {};

const isTeleported: Record<string, boolean> = {};
const isRespawned: Record<string, boolean> = {};
const respawnedPos: Record<string, Vec3> = {};
const isTeleportedBySuspection: Record<string, boolean> = {};

const haveFished: Record<string, boolean> = {};
const isKnockbacked: Record<string, boolean> = {};
const damagedTime: Record<string, number> = {};
const pushedByPiston: Record<string, boolean> = {};

const removeTeleportedTimeout: Record<string, NodeJS.Timeout> = {};

export const lastRotations = new Map<string, { x: number; y: number }[]>();
function appendRotationRecord(
	player: ServerPlayer,
	rotation: { x: number; y: number }
) {
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
	const currentHeadPosBlock = region.getBlock(
		BlockPos.create(headPos.x, headPos.y, headPos.z)
	);

	if (currentPosBlock.getName().includes("ladder")
		|| currentPosBlock.getName().includes("vine")
		|| currentPosBlock.getName().includes("powder_snow")
		|| currentHeadPosBlock.getName().includes("ladder")
		|| currentHeadPosBlock.getName().includes("vine")
		|| currentHeadPosBlock.getName().includes("powder_snow")
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

events.packetBefore(MinecraftPacketIds.PlayerAction).on((pkt, ni) => {
	const pl = ni.getActor()!;
	if (!pl) return;
	const plname = pl.getName();
	if (pkt.action === PlayerActionPacket.Actions.StartSpinAttack) {
		isSpinAttacking[plname] = true;
	} else if (pkt.action === PlayerActionPacket.Actions.StopSpinAttack) {
		isSpinAttacking[plname] = false;
	};
});

function isMovePlayerPacket(pkt: Packet): pkt is MovePlayerPacket {
	return (<MovePlayerPacket>pkt).onGround !== undefined;
};

function isPlayerAuthInputPacket(pkt: Packet): pkt is PlayerAuthInputPacket {
	return (<PlayerAuthInputPacket>pkt).moveX !== undefined;
};

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
// 		}, 1000);
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


events.packetBefore(MinecraftPacketIds.PlayerAuthInput).on((pkt, ni) => {
	const pl = ni.getActor();
	if (!pl) return;

	pl.syncAbilities();

	const plname = pl.getName();

	const movePos = pkt.pos;
	movePos.y -= 1.62001190185547;

	if (typeof airTicks[plname] !== "number") airTicks[plname] = 0;

	const groundY = 1/64;

	const region = pl.getRegion()!;

	let actualOnGround = false;

	let nearGround = false;

	if (region.getBlock(BlockPos.create(movePos.x - 0.3, movePos.y - 0.1, movePos.z - 0.3)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x - 0.3, movePos.y - 0.1, movePos.z + 0.3)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x + 0.3, movePos.y - 0.1, movePos.z + 0.3)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x + 0.3, movePos.y - 0.1, movePos.z - 0.3)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x, movePos.y - 0.1, movePos.z)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x - 0.3, movePos.y - 0.1, movePos.z)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x, movePos.y - 0.1, movePos.z + 0.3)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x + 0.3, movePos.y - 0.1, movePos.z)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x, movePos.y - 0.1, movePos.z - 0.3)).getName() !== "minecraft:air") {
		actualOnGround = true;
	};

	if (region.getBlock(BlockPos.create(movePos.x - 0.6, movePos.y - 0.499, movePos.z - 0.6)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x - 0.6, movePos.y - 0.499, movePos.z + 0.6)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x + 0.6, movePos.y - 0.499, movePos.z + 0.6)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x + 0.6, movePos.y, movePos.z - 0.6)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x, movePos.y - .499, movePos.z)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x - 0.6, movePos.y - .499, movePos.z)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x, movePos.y - - .499, movePos.z + 0.6)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x + 0.6, movePos.y - 0.499, movePos.z)).getName() !== "minecraft:air" ||
	region.getBlock(BlockPos.create(movePos.x, movePos.y - 0.499, movePos.z - 0.6)).getName() !== "minecraft:air") {
		nearGround = true;
	};

	if (/*(Math.abs(movePos.y) % groundY < 0.0001) &&*/ pkt.delta.y + 0.07840000092983246 === 0 && actualOnGround) {
		airTicks[plname] = 0;
	} else {
		airTicks[plname]++;
	};

	
	const og = /*(Math.abs(movePos.y) % groundY < 0.0001) &&*/ pkt.delta.y + 0.07840000092983246 === 0;

	onGround[plname] = og;

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

	const accel = Math.abs(deltaXZ - ZXlastDelta);
	const squaredAccel = accel * 100;

	const prediction = ZXlastDelta * 0.91;
	const predDiff = deltaXZ - prediction - 0.0256;
	const deltaY = pkt.delta.y + 0.07840000092983246;

	const accelY = deltaY - YlastDelta;

	let cancelled = false;

	if (CIFconfig.Modules.movement) {

		if (pl.getGameType() === GameType.Survival || pl.getGameType() === GameType.Adventure) {

			if (!pl.getAbilities().getAbility(AbilitiesIndex.MayFly).getBool() &&
				!pl.getAbilities().getAbility(AbilitiesIndex.Flying).getBool()
				&& !pl.isFlying()
				&& !pl.onClimbable()) {

				if (deltaYaw > 1.5 && deltaXZ > .150 && squaredAccel < 1.0E-5) {
					CIF.failAndFlag(ni, "Speed-E", `Invalid deceleration while turning around`, 5);

					const lastposit = lastpos[plname];
					pl.runCommand(`tp ${lastposit[0]} ${lastposit[1]} ${lastposit[2]}`);
					cancelled = true;
				};

				if ((predDiff > 0 && !pl.onGround() && airTicks[plname] > 1)) {
					CIF.failAndFlag(ni, "Speed-F", `Invalid deceleration while being in air`, 9);

					const lastposit = lastpos[plname];
					pl.runCommand(`tp ${lastposit[0]} ${lastposit[1]} ${lastposit[2]}`);
					cancelled = true;
				};



				if (!pl.isRiding() && !pl.isInLava() && !pl.isInWater() && !pl.isInScaffolding() && !pl.isInSnow() && !pl.onClimbable() && !pl.onSlowFallingBlock() &&
					!pl.hasEffect(MobEffectIds.Levitation)) {

					if (airTicks[plname] > 2 && !pl.onGround() && deltaY < 0 && accelY === 0) {
						CIF.failAndFlag(ni, "Fly-A", `Glides constantly`, 5);

						const lastposit = lastpos[plname];
						pl.runCommand(`tp ${lastposit[0]} ~ ${lastposit[2]}`);

						cancelled = true;
					};

					if (airTicks[plname] > 19 && !pl.onGround() && deltaY < 0 && accelY < 0 && deltaY > -0.5) {
						CIF.failAndFlag(ni, "Fly-D", `Glides less, less`, 5);

						const lastposit = lastpos[plname];
						pl.runCommand(`tp ${lastposit[0]} ~ ${lastposit[2]}`);

						cancelled = true;
					};

					if (airTicks[plname] > 9 && !pl.onGround() && deltaY > 0 && accelY === 0) {
						CIF.failAndFlag(ni, "Fly-C", `Flew up constantly`, 5);

						const lastposit = lastpos[plname];
						pl.runCommand(`tp ${lastposit[0]} ${lastposit[1]} ${lastposit[2]}`);

						cancelled = true;
					};



					if (!pl.hasEffect(MobEffectIds.SlowFalling)) {
						if (airTicks[plname] > 19 && !pl.onGround() && deltaY < -0.5 && accelY === 0) {
							CIF.failAndFlag(ni, "Fly-E", `Glides too slowly`, 5);

							const lastposit = lastpos[plname];
							pl.runCommand(`tp ${lastposit[0]} ~ ${lastposit[2]}`);
							
							cancelled = true;
						};
					};


					if (!actualOnGround && deltaY === 0 && deltaXZ > 0 && accelY === 0 && airTicks[plname] > 1) {
						CIF.failAndFlag(ni, "Fly-B", `No Y changes`, 5);

						const lastposit = lastpos[plname];
						pl.runCommand(`tp ${lastposit[0]} ${lastposit[1]} ${lastposit[2]}`);

						cancelled = true;
					};

					if (airTicks[plname] > 2 && accelY > 0 && !nearGround) {
						CIF.failAndFlag(ni, "Fly-F", `Flew up in mid-air`, 3);

						const lastposit = lastpos[plname];
						pl.runCommand(`tp ${lastposit[0]} ${lastposit[1]} ${lastposit[2]}`);

						cancelled = true;
					};
				};
			};

		};

	};


	if (!cancelled) {
		lastDeltaXZ[plname] = deltaXZ;
		lastDeltaY[plname] = deltaY;
		lastpos[plname] = [movePos.x, movePos.y, movePos.z];
		setLastPositions(plname, { x: movePos.x, y: movePos.y, z: movePos.z });
	} else {
		lastpos[plname] = lastpos[plname];
		setLastPositions(plname, { x: lastpos[plname][0], y: lastpos[plname][1], z: lastpos[plname][2] });
	};

	lastYaw[plname] = yaw;

	movePos.y += 1.62001190185547;
});

// const hasTeleport = procHacker.hooking(
// 	"?teleportTo@Player@@UEAAXAEBVVec3@@_NHH1@Z",
// 	void_t,
// 	null,
// 	ServerPlayer,
// 	Vec3
// )((pl, pos) => {
// 	const plname = pl.getName()!;
// 	if (isTeleportedBySuspection[plname] === true) {
// 		isTeleportedBySuspection[plname] = false;
// 		return hasTeleport(pl, pos);
// 	};

// 	isTeleported[plname] = true;
// 	clearTimeout(removeTeleportedTimeout[plname]);

// 	removeTeleportedTimeout[plname] = setTimeout(() => {
// 		isTeleported[plname] = false;
// 	}, 2500);

// 	return hasTeleport(pl, pos);
// });

// events.entityKnockback.on((ev) => {
// 	if (!ev.target.isPlayer()) return;

// 	const pl = ev.target as ServerPlayer;
// 	const plname = pl.getName();
// 	isKnockbacked[plname] = true;
// 	damagedTime[plname] = Date.now();
// 	setTimeout(() => {
// 		const now = Date.now();
// 		if (now - damagedTime[plname] > 1800) isKnockbacked[plname] = false;
// 	}, 2500);
// });

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
