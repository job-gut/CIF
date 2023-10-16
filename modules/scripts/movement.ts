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
import { VoidPointer } from "bdsx/core";
import { PlayerJumpEvent } from "bdsx/event_impl/entityevent";

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

events.packetBefore(MinecraftPacketIds.PlayerAction).on((pkt, ni) => {
	const pl = ni.getActor()!;
	if (!pl) return;
	const plname = pl.getName();
	if (pkt.action === PlayerActionPacket.Actions.StartSpinAttack) {
		isSpinAttacking[plname] = true;
	} else if (pkt.action === PlayerActionPacket.Actions.StopSpinAttack) {
		isSpinAttacking[plname] = false;
	};

	if (pkt.action === PlayerActionPacket.Actions.StartGlide) {
		// usedElytra[plname] = true;

		if (pl.getArmor(ArmorSlot.Torso).getRawNameId() !== "elytra") {
			return CIF.detect(ni, "Fly-E", "Glide Without Elytra");
		};

	}
	// else if (pkt.action === PlayerActionPacket.Actions.StopGlide) {
	// 	usedElytra[plname] = false;
	// };
});

function isMovePlayerPacket(pkt: Packet): pkt is MovePlayerPacket {
	return (<MovePlayerPacket>pkt).onGround !== undefined;
};

function isPlayerAuthInputPacket(pkt: Packet): pkt is PlayerAuthInputPacket {
	return (<PlayerAuthInputPacket>pkt).moveX !== undefined;
};

class FishingHook extends Actor {
}

const getFishingTarget = procHacker.js("?getFishingTarget@FishingHook@@QEAAPEAVActor@@XZ", Actor, null, FishingHook);
function onRetrieve(hook: FishingHook): number {
	const result = _onRetrieve(hook);
	if (result === 3) {
		const target = getFishingTarget(hook);
		if (target !== null && target.isPlayer()) {
			const name = target.getName();
			haveFished[name] = true;
			setTimeout(() => {
				haveFished[name] = false;
			}, 1000);
		}
	}
	return result;
}
const _onRetrieve = procHacker.hooking("?retrieve@FishingHook@@QEAAHXZ", int32_t, null, FishingHook)(onRetrieve);

const startGlide = procHacker.hooking(
	"?startGliding@Player@@QEAAXXZ",
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

const pistonPush = procHacker.hooking(
	"?moveEntityLastProgress@PistonBlockActor@@QEAAXAEAVActor@@VVec3@@@Z",
	void_t,
	null,
	BlockActor,
	Actor,
	Vec3
)((blockActor, actor, pos) => {
	if (actor.isPlayer()) {
		const name = actor.getName();
		pushedByPiston[name] = true
		setTimeout(() => {
			pushedByPiston[name] = false
		}, 1000);
	};

	return pistonPush(blockActor, actor, pos);
});

const MovMovementProxy$_getMob = procHacker.js("?getEntity@?$DirectActorProxyImpl@UIPlayerMovementProxy@@@@UEAAAEAVEntityContext@@XZ", Actor, null, VoidPointer);
function onMobJump(movementProxy: VoidPointer, blockSourceInterface: VoidPointer): void {
    const mob = MovMovementProxy$_getMob(movementProxy);
    if (mob instanceof Player) {
        const event = new PlayerJumpEvent(mob);
        events.playerJump.fire(event);
    }
    return _onMobJump(movementProxy, blockSourceInterface);
}
const _onMobJump = procHacker.hooking("?jumpFromGround@Mob@@IEAAXAEBVIConstBlockSource@@@Z", void_t, null, VoidPointer, VoidPointer)(onMobJump);

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

events.packetBefore(MovementType).on((pkt, ni) => {
	const player = ni.getActor();
	if (!player) return;

	if (CIFconfig.Modules.crasher === true) {

		if (pkt.pos.x > UINTMAX || pkt.pos.y > UINTMAX || pkt.pos.z > UINTMAX) {
			CIF.ban(ni, "crasher");
			return CIF.detect(ni, "crasher", "Illegal Position");
		};

		if (isNaN(pkt.pitch) || isNaN(pkt.yaw)) {
			CIF.ban(ni, "Crasher");
			return CIF.detect(ni, "crasher", "Illegal Head Pos");
		};
	}

	const plname = player.getName();

	const movePos = pkt.pos;
	movePos.y -= 1.62001190185547;

	if (CIFconfig.Modules.movement !== true) {
		lastpos[plname] = [movePos.x, movePos.y, movePos.z];
		setLastPositions(plname, { x: movePos.x, y: movePos.y, z: movePos.z });
		movePos.y += 1.62001190185547;
		return;
	};

	if (isMovePlayerPacket(pkt)) {
		onGround[plname] = pkt.onGround;
	} else if (isPlayerAuthInputPacket(pkt)) {
		onGround[plname] = pkt.headYaw === -0.07840000092983246;
	};

	const rotation = {
		x: pkt.headYaw,
		y: pkt.pitch,
	};

	appendRotationRecord(player, rotation);

	const gamemode = player.getGameType();
	if (gamemode !== 2 && gamemode !== 0) {
		movePos.y += 1.62001190185547;
		lastpos[plname] = [movePos.x, movePos.y, movePos.z];
		setLastPositions(plname, { x: movePos.x, y: movePos.y, z: movePos.z });
		return;
	};

	//PHASE
	const region = player.getRegion()!;
	const currentPosBlock = region.getBlock(
		BlockPos.create(movePos.x, movePos.y, movePos.z)
	);
	const currentHeadPosBlock = region.getBlock(
		BlockPos.create(movePos.x, movePos.y + 1.62001190185547, movePos.z)
	);

	if (
		currentPosBlock.isSolid() &&
		currentHeadPosBlock.isSolid() &&
		!currentPosBlock.getName().includes("air") &&
		!currentHeadPosBlock.getName().includes("air") &&
		player.getGameType() !== GameType.Spectator &&
		player.getGameType() !== GameType.CreativeSpectator &&
		player.getGameType() !== GameType.Creative &&
		player.getGameType() !== GameType.SurvivalSpectator &&
		CIFconfig.Modules.movement === true
	) {

		if (isTeleported[plname] === true && isTeleportedBySuspection[plname] === true) {
			player.teleport(player.getPosition(), undefined,);
		} else if (isTeleported[plname] === true && !isTeleportedBySuspection[plname]) return;
		
		player.teleport(player.getPosition(), undefined,);
	};

	if (
		isTeleported[plname] ||
		player.isSpinAttacking() ||
		player.isGlidingWithElytra() ||
		isKnockbacked[plname] ||
		isSpinAttacking[plname] ||
		wasJoinedIn15seconds.get(ni) ||
		player.isFlying() ||
		pushedByPiston[plname] ||
		isRespawned[plname] ||

		player.getAbilities().getAbility(AbilitiesIndex.MayFly).value.boolVal
	) {
		lastpos[plname] = [movePos.x, movePos.y, movePos.z];
		setLastPositions(plname, { x: movePos.x, y: movePos.y, z: movePos.z });
		lastBPS[plname] = player.getLastBPS();
		movePos.y += 1.62001190185547;
		lastWentUpBlocks[plname] = 10000000000;
		return;
	};

	const lastPos = lastpos[plname];
	const plSpeed = player.getSpeed();

	//Normal Speed ≒ 0.13
	//5.62 is max speed without any speed effects and while sprinting.
	const maxBPS = plSpeed * 45;

	let bps: number;
	let distance: number;
	let displayedBPS: number;

	if (typeof lastPos[0] === "number") {
		const x1 = lastPos[0];
		const x2 = movePos.x;
		const y1 = lastPos[2];
		const y2 = movePos.z;

		const xDiff = Math.pow(x1 - x2, 2);
		const yDiff = Math.pow(y1 - y2, 2);
		distance = Math.sqrt(xDiff + yDiff);

		bps = Number((distance * 20).toFixed(5));
		displayedBPS = Number(String(distance * 20).slice(0, 4));
	} else {
		bps = 0;
		lastBPS[plname] = bps;
		lastpos[plname] = [movePos.x, movePos.y, movePos.z];
		setLastPositions(plname, { x: movePos.x, y: movePos.y, z: movePos.z });
		movePos.y += 1.62001190185547;
		distance = 0;
		return;
	};

	lastBPSForExportedFunc[plname] = bps;

	if (bps > maxBPS && bps > 6 && CIFconfig.Modules.movement === true && !player.isGlidingWithElytra()) {
		if (lastBPS[plname] === bps) {
			strafestack[plname] = strafestack[plname]
				? strafestack[plname] + 1
				: 1;

			isTeleportedBySuspection[plname] = true;
			player.runCommand("tp ~ ~ ~");

			if (strafestack[plname] > 7) {
				strafestack[plname] = 0;
				CIF.ban(ni, "Speed-B");
				CIF.detect(
					ni,
					"Speed-B",
					`Strafe | Blocks per second : ${displayedBPS}`
				);
			}

		} else {
			strafestack[plname] = strafestack[plname]
				? strafestack[plname] - 1
				: 0;
			if (strafestack[plname] < 0) strafestack[plname] = 0;
		};

		if (player.onIce() && player.isRiding()) {
			//Just for Exception
		} else if (!player.onIce() && player.isRiding()) {
			//TODO: get Max BPS and check If player uses entity speed
		};

		if (
			!player.onIce() &&
			!player.isRiding() &&
			!isKnockbacked[plname] &&
			!haveFished[plname] &&
			bps >= plSpeed * 150
		) {
			tooFastStack[plname] = tooFastStack[plname]
				? tooFastStack[plname] + 1
				: 1;

			if (tooFastStack[plname] > 7) {
				tooFastStack[plname] = 0;
				CIF.detect(
					ni,
					"Speed-A",
					`Too Fast | Blocks per second : ${displayedBPS}`
				);
			};
		} else {
			tooFastStack[plname] = tooFastStack[plname]
				? tooFastStack[plname] - 1
				: 0;
			if (tooFastStack[plname] < 0) tooFastStack[plname] = 0;
		};

		if (
			!player.onIce() &&
			!player.isRiding() &&
			!isKnockbacked[plname] &&
			!haveFished[plname] &&
			bps > plSpeed * 61.5 &&
			!player.isUnderAnyBlock()
		) {
			littleFastStack[plname] = littleFastStack[plname]
				? littleFastStack[plname] + 1
				: 1;

			if (littleFastStack[plname] > 5) {
				littleFastWarn[plname] = littleFastWarn[plname]
					? littleFastWarn[plname] + 1
					: 1;
				littleFastStack[plname] = 0;

				if (littleFastWarn[plname] > 2) {
					littleFastWarn[plname] = 0;
					CIF.ban(ni, "Speed-C");
					CIF.detect(
						ni,
						"Speed-C",
						`Little Fast | Blocks per second : ${displayedBPS}`
					);
				};

				setTimeout(() => {
					littleFastWarn[plname]--;
					if (littleFastWarn[plname] < 0) littleFastWarn[plname] = 0;
				}, 3000);
			};
		} else {
			littleFastStack[plname] = 0;
		};
	};

	if (typeof Fly_bStack[plname] !== "number") {
		Fly_bStack[plname] = 0;
	};

	if (typeof respawnedPos[plname] !== "object") {
		respawnedPos[plname] = Vec3.create({ x: 99999, y: 99999, z: 99999 });
	};

	if (Number(distance.toFixed(2)) >= maxBPS && !isRespawned[plname] && respawnedPos[plname].distance(movePos) > 2 && !isTeleported[plname] && maxBPS !== 0) {
		CIF.suspect(ni, "teleport", "Teleported over speed limit");
		isTeleportedBySuspection[plname] = true;
		player.runCommand("tp ~ ~ ~");

		movePos.y += 1.62001190185547;
		return;
	};

	const lastY = lastPos[1];

	let waterStack = 0;

	outerFor: for (let x = movePos.x - 1; x <= movePos.x + 1; x++) {
		for (let y = movePos.y - 1; y === movePos.y; y++) {
			for (let z = movePos.z - 1; z <= movePos.z + 1; z++) {
				const block = region.getBlock(
					BlockPos.create({ x: x, y: y, z: z })
				);
				const blockName = block.getName();
				if (!blockName.includes("water")) {
					break outerFor;
				};
				lastWentUpBlocks[plname] = 10000000000;
				waterStack++;
			};
		};
	};

	const underblock = region.getBlock(
		BlockPos.create({ x: movePos.x, y: movePos.y - 1, z: movePos.z })
	);
	const blockName = underblock.getName();
	if (blockName.includes("water") && waterStack === 18) {
		if (player.onGround()) {
			CIF.ban(ni, "WaterWalker");
			CIF.detect(ni, "WaterWalker", "Walks on water like a solid block");
		};
	};

	for (let x = movePos.x - 1; x <= movePos.x + 1; x++) {
		for (let y = movePos.y - 1; y <= movePos.y + 1; y++) {
			for (let z = movePos.z - 1; z <= movePos.z + 1; z++) {
				const block = region.getBlock(
					BlockPos.create({ x: x, y: y, z: z })
				);
				const blockName = block.getName();
				if (blockName === "minecraft:ladder" || blockName === "minecraft:vine" ||
					blockName === "minecraft:scaffolding" ||
					blockName.includes("water") || blockName.includes("lava")
				) {
					lastBPS[plname] = bps;
					lastpos[plname] = [movePos.x, movePos.y, movePos.z];
					setLastPositions(plname, { x: movePos.x, y: movePos.y, z: movePos.z });

					Fly_c1Stack[plname] = 0;

					lastWentUpBlocks[plname] = 10000000000;
					movePos.y += 1.62001190185547;
					return;
				};
			};
		};
	};

	if (typeof Fly_c1Stack[plname] !== "number") Fly_c1Stack[plname] = 0;

	const hasLevitation = player.getEffect(MobEffectIds.Levitation);

	if (lastWentUpBlocks[plname] > 0 && !hasLevitation) {
		if (lastWentUpBlocks[plname].toString().slice(0, 9) === (movePos.y - lastY).toString().slice(0, 9)) {
			Fly_c1Stack[plname]++;
			isTeleportedBySuspection[plname] = true;
			player.runCommand("tp ~ ~ ~");

			if (Fly_c1Stack[plname] > 4) {
				CIF.detect(ni, "Fly-C", "Increasing value of Y is constant");
			};
		} else {
			Fly_c1Stack[plname]--;
			if (Fly_c1Stack[plname] < 0) Fly_c1Stack[plname] = 0;
		};
	} else if (lastWentUpBlocks[plname] < 0) {
		if (Fly_c1Stack[plname] < 0) Fly_c1Stack[plname] = 0;
	};

	if (typeof lastWentUpBlocks[plname] !== "number") lastWentUpBlocks[plname] = 0;
	if (lastWentUpBlocks[plname] === 10000000000) {
		lastWentUpBlocks[plname] = movePos.y - lastY;
	};

	if (region.getBlock(BlockPos.create({ x: movePos.x, y: movePos.y - 1, z: movePos.z })).getName() !== "minecraft:air") {
		lastWentUpBlocks[plname] = 10000000000;
	};


	const currentTick = player.getLevel().getCurrentTick();

	if (lastWentUpBlocks[plname] < movePos.y - lastY && movePos.y - lastY > 0 && 
		!hasLevitation && !onGround
		&& currentTick - jumpedTick[plname] > 19) {
		Fly_c2Stack[plname] = typeof Fly_c2Stack[plname] !== "number" ? 1 : Fly_c2Stack[plname] + 1;
		setTimeout(() => {
			Fly_c2Stack[plname]--;
			if (Fly_c2Stack[plname] < 0) Fly_c2Stack[plname] = 0;
		}, 4990).unref();

		if (Fly_c2Stack[plname] > 2) {
			CIF.ban(ni, "AirJump");
			CIF.detect(ni, "AirJump", "Y boost in mid-air");
		};

		isTeleportedBySuspection[plname] = true;
		player.runCommand("tp ~ ~ ~");
	};

	lastWentUpBlocks[plname] = movePos.y - lastY;
	if (lastWentUpBlocks[plname] < 0) lastWentUpBlocks[plname] = 0;

	for (let x = movePos.x - 1; x <= movePos.x + 1; x++) {
		for (let y = movePos.y - 1; y <= movePos.y + 1; y++) {
			for (let z = movePos.z - 1; z <= movePos.z + 1; z++) {
				const block = region.getBlock(
					BlockPos.create({ x: x, y: y, z: z })
				);
				const blockName = block.getName();
				if (blockName !== "minecraft:air") {
					lastBPS[plname] = bps;
					lastpos[plname] = [movePos.x, movePos.y, movePos.z];
					setLastPositions(plname, { x: movePos.x, y: movePos.y, z: movePos.z });

					if (bps > 0.1) Fly_bStack[plname] = 0;

					lastWentUpBlocks[plname] = 10000000000;
					movePos.y += 1.62001190185547;
					return;
				};
			};
		};
	};

	if (movePos.y < -61) {
		lastBPS[plname] = bps;
		lastpos[plname] = [movePos.x, movePos.y, movePos.z];
		setLastPositions(plname, { x: movePos.x, y: movePos.y, z: movePos.z });

		Fly_bStack[plname] = 0;

		lastWentUpBlocks[plname] = 10000000000;
		movePos.y += 1.62001190185547;
		return;
	};

	if (lastY === movePos.y && !isTeleported[plname]) {
		if (lastPos[0] === movePos.x && lastPos[2] === movePos.z) return;

		Fly_bStack[plname]++;

		if (Fly_bStack[plname] > 14) {
			Fly_bStack[plname] = 0;
			CIF.ban(ni, "Fly-B");
			CIF.detect(ni, "Fly-B", "Non-Vertical Fly on Air");
		};

		isTeleportedBySuspection[plname] = true;
		player.runCommand("tp ~ ~ ~");
	} else {
		Fly_bStack[plname]--;
		if (Fly_bStack[plname] < 0) Fly_bStack[plname] = 0;
	};

	if (haveFished[plname]) {
		lastpos[plname] = [movePos.x, movePos.y, movePos.z];
		setLastPositions(plname, { x: movePos.x, y: movePos.y, z: movePos.z });
		lastBPS[plname] = player.getLastBPS();
		movePos.y += 1.62001190185547;
		lastWentUpBlocks[plname] = 10000000000;
		return;
	};

	lastBPS[plname] = bps;
	lastpos[plname] = [movePos.x, movePos.y, movePos.z];
	setLastPositions(plname, { x: movePos.x, y: movePos.y, z: movePos.z });
	movePos.y += 1.62001190185547;
});

const hasTeleport = procHacker.hooking(
	"?teleportTo@Player@@UEAAXAEBVVec3@@_NHH1@Z",
	void_t,
	null,
	ServerPlayer,
	Vec3
)((pl, pos) => {
	const plname = pl.getName()!;
	if (isTeleportedBySuspection[plname] === true) {
		isTeleportedBySuspection[plname] = false;
		return hasTeleport(pl, pos);
	};

	isTeleported[plname] = true;
	clearTimeout(removeTeleportedTimeout[plname]);

	removeTeleportedTimeout[plname] = setTimeout(() => {
		isTeleported[plname] = false;
	}, 2500);

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
		if (now - damagedTime[plname] > 1800) isKnockbacked[plname] = false;
	}, 2500);
});

events.playerRespawn.on((ev) => {
	const pl = ev.player;
	const plname = pl.getName();

	const x = pl.getFeetPos().x;
	const y = pl.getFeetPos().y;
	const z = pl.getFeetPos().z;

	isRespawned[plname] = true;
	respawnedPos[plname] = Vec3.create(pl.getFeetPos());
	lastpos[plname] = [x, y, z];
	setTimeout(() => {
		isRespawned[plname] = false;
		respawnedPos[plname] = Vec3.create({ x: 99999, y: 99999, z: 99999 });
	}, 2500);
});

events.playerJump.on((ev)=> {
	const pl = ev.player;
	const plname = pl.getName();

	const tick = pl.getLevel().getCurrentTick();

	jumpedTick[plname] = tick;
});

