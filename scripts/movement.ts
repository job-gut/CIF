import { Actor } from "bdsx/bds/actor";
import { Block } from "bdsx/bds/block";
import { BlockPos, Vec3 } from "bdsx/bds/blockpos";
import { ArmorSlot } from "bdsx/bds/inventory";
import { Packet } from "bdsx/bds/packet";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { MovePlayerPacket, PlayerActionPacket, PlayerAuthInputPacket } from "bdsx/bds/packets";
import { GameType, Player, ServerPlayer } from "bdsx/bds/player";
import { events } from "bdsx/event";
import { bool_t, float32_t, void_t } from "bdsx/nativetype";
import { procHacker } from "bdsx/prochacker";
import { serverProperties } from "bdsx/serverproperties";
import { CIFconfig } from "../configManager";
import { CIF } from "../main";
import { wasJoinedIn15seconds } from "./join";

export const MovementType =
	serverProperties["server-authoritative-movement"] === "client-auth"
		? MinecraftPacketIds.MovePlayer
		: MinecraftPacketIds.PlayerAuthInput;

const lastBPS: Record<string, number> = {};
const isSpinAttacking: Record<string, boolean> = {};
const onGround: Record<string, boolean> = {};
const isGlidingWithElytra: Record<string, boolean> = {};

const lastpos: Record<string, number[]> = {};

const jumpedTick: Record<string, number> = {};

const strafestack: Record<string, number> = {};
const tooFastStack: Record<string, number> = {};
const littleFastStack: Record<string, number> = {};
const littleFastWarn: Record<string, number> = {};

const Fly_bStack: Record<string, number> = {};

const isTeleported: Record<string, boolean> = {};
const haveFished: Record<string, boolean> = {};
const isKnockbacking: Record<string, boolean> = {};
const damagedTime: Record<string, number> = {};

const susToTeleport: Record<string, boolean> = {};

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

declare module "bdsx/bds/actor" {
	interface Actor {
		/**
		 * Func from CIF
		 */
		getFallDistance(): number;

		/**
		 * Func from CIF
		 */
		setFallDistance(distance: number): void;
	}
};

Actor.prototype.getFallDistance = procHacker.js(
	"?getFallDistance@Actor@@QEBAMXZ",
	float32_t,
	{ this: Actor }
);
Actor.prototype.setFallDistance = procHacker.js(
	"?setFallDistance@Actor@@QEAAXM@Z",
	void_t,
	{ this: Actor }
);

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
		 * Returns player's Last Blocks per second (Func from CIF)
		 */
		getLastBPS(): number;

		/**
		 * Returns if player is not on mid-air (Func from CIF)
		 * @description it always returns false in server-auth movement
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
	if (!lastBPS[plname]) lastBPS[plname] = 0;
	return lastBPS[plname];
};

Player.prototype.onGround = function () {
	const plname = this.getName();
	if (!onGround[plname]) onGround[plname] = false;
	return onGround[plname];
};

Player.prototype.isGlidingWithElytra = function () {
	const plname = this.getName();
	if (!isGlidingWithElytra[plname]) isGlidingWithElytra[plname] = false;
	return isGlidingWithElytra[plname];
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
		isGlidingWithElytra[plname] = true;

		if (pl.getArmor(ArmorSlot.Torso).getRawNameId() !== "elytra") {
			return CIF.detect(ni, "Fly-E", "Glide Without Elytra")	;
		};

	} else if (pkt.action === PlayerActionPacket.Actions.StopGlide) {
		isGlidingWithElytra[plname] = false;
	};

	if (pkt.action === PlayerActionPacket.Actions.Jump) {
		jumpedTick[plname] = pl.getLevel().getCurrentTick();
	};
});

function isMovePlayerPacket(pkt: Packet): pkt is MovePlayerPacket {
	return (<MovePlayerPacket>pkt).onGround !== undefined;
};

events.packetBefore(MovementType).on((pkt, ni) => {
	const player = ni.getActor();
	if (!player) return;

	const movePos = pkt.pos;
	movePos.y -= 1.62001190185547;

	const plname = player.getName();
	if (isMovePlayerPacket(pkt)) {
		onGround[plname] = pkt.onGround;

		//respawn
		if (pkt.mode === 1) {
			lastpos[plname] = [movePos.x, movePos.y, movePos.z];
			movePos.y += 1.62001190185547;
			player.setFallDistance(3);
			return;
		};
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
		player.runCommand("tp ~ ~ ~");
	};

	const torso = player.getArmor(ArmorSlot.Torso);

	if (
		isTeleported[plname] ||
		player.isSpinAttacking() ||
		torso.getRawNameId() === "elytra" ||
		isKnockbacking[plname] ||
		isSpinAttacking[plname] ||
		wasJoinedIn15seconds.get(ni)
	) {
		lastpos[plname] = [movePos.x, movePos.y, movePos.z];
		susToTeleport[plname] = false;
		lastBPS[plname] = 0;
		movePos.y += 1.62001190185547;
		return;
	};

	const lastPos = lastpos[plname];
	const plSpeed = player.getSpeed();

	//5.62 is max speed without any speed effects and while sprinting.
	const maxBPS = plSpeed * 45;

	let bps: number;

	if (lastPos) {
		const x1 = lastPos[0];
		const x2 = movePos.x;
		const y1 = lastPos[2];
		const y2 = movePos.z;

		const xDiff = Math.pow(x1 - x2, 2);
		const yDiff = Math.pow(y1 - y2, 2);

		if (Number(Math.sqrt(xDiff + yDiff).toFixed(2)) >= 8) {
			if (susToTeleport[plname] === true) {
				susToTeleport[plname] = false;
				bps = 0;
				lastBPS[plname] = bps;
				lastpos[plname] = [movePos.x, movePos.y, movePos.z];
				movePos.y += 1.62001190185547;
				return;
			};

			susToTeleport[plname] = true;
			bps = 0;
			lastBPS[plname] = bps;
			lastpos[plname] = [movePos.x, movePos.y, movePos.z];
			movePos.y += 1.62001190185547;
			return;
		};

		if (susToTeleport[plname] === true) {
			susToTeleport[plname] = false;
			CIF.detect(ni, "teleport", "Teleport and Moved");
		};

		bps = Number((Math.sqrt(xDiff + yDiff) * 20).toFixed(2));
	} else {
		bps = 0;
		lastBPS[plname] = bps;
		lastpos[plname] = [movePos.x, movePos.y, movePos.z];
		movePos.y += 1.62001190185547;
		return;
	};

	if (bps > maxBPS && bps > 5.61 && CIFconfig.Modules.movement === true) {
		if (player.getLastBPS() === bps) {
			strafestack[plname] = strafestack[plname]
				? strafestack[plname] + 1
				: 1;
			if (strafestack[plname] > 14) {
				strafestack[plname] = 0;
				CIF.ban(ni, "Speed-B");
				CIF.detect(
					ni,
					"Speed-B",
					`Strafe | Blocks per second : ${bps}`
				);
			}
		} else {
			strafestack[plname] = strafestack[plname]
				? strafestack[plname] - 1
				: 0;
			if (strafestack[plname] < 0) strafestack[plname] = 0;
		};

		if (player.onIce() && player.isRiding()) {
			//이거는 그냥 의미 없는 짓거리
		} else if (player.onIce() && !player.isRiding()) {
			//대충 max bps 구해서 처리하는거 만들기
		} else if (!player.onIce() && player.isRiding()) {
			//대충 max bps 구해서 처리하는거 만들기
		};

		if (
			!player.onIce() &&
			!player.isRiding() &&
			!isKnockbacking[plname] &&
			!haveFished[plname] &&
			bps >= plSpeed * 100
		) {
			tooFastStack[plname] = tooFastStack[plname]
				? tooFastStack[plname] + 1
				: 1;

			if (tooFastStack[plname] > 4) {
				tooFastStack[plname] = 0;
				CIF.detect(
					ni,
					"Speed-A",
					`Too Fast | Blocks per second : ${bps}`
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
			!isKnockbacking[plname] &&
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
					CIF.detect(
						ni,
						"Speed-C",
						`Little Fast | Blocks per second : ${bps}`
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

					Fly_bStack[plname] = 0;

					movePos.y += 1.62001190185547;
					return;
				};
			};
		};
	};

	const lastY = lastPos[1];

	if (lastY === movePos.y && !isTeleported[plname]) {
		Fly_bStack[plname]++;

		if (Fly_bStack[plname] > 9) {
			Fly_bStack[plname] = 0;
			CIF.ban(ni, "Fly-B");
			CIF.detect(ni, "Fly-B", "Non-Vertical Fly on Air");
		};
	} else {
		Fly_bStack[plname]--;
		if (Fly_bStack[plname] < 0) Fly_bStack[plname] = 0;
	};

	lastBPS[plname] = bps;
	lastpos[plname] = [movePos.x, movePos.y, movePos.z];
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
	isTeleported[plname] = true;
	setTimeout(async () => {
		isTeleported[plname] = false;
	}, 1500);
	pl.setFallDistance(3);

	return hasTeleport(pl, pos);
});

events.entityKnockback.on((ev) => {
	if (!ev.target.isPlayer()) return;

	const pl = ev.target as ServerPlayer;
	const plname = pl.getName();
	isKnockbacking[plname] = true;
	damagedTime[plname] = Date.now();
	setTimeout(() => {
		const now = Date.now();
		if (now - damagedTime[plname] > 1800) isKnockbacking[plname] = false;
	}, 2000);
});
