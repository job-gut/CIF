import { Vec2, Vec3 } from "bdsx/bds/blockpos";
import { GameType, Player, ServerPlayer } from "bdsx/bds/player";
import { BuildPlatform, CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { CIF } from "../../main";
import { lastPositions, lastRotations } from "./movement";
import { CIFconfig } from "../util/configManager";
import { ActorDamageCause } from "bdsx/bds/actor";
import { MobEffectIds } from "bdsx/bds/effects";
import { bedrockServer } from "bdsx/launcher";
import { RakNet } from "bdsx/bds/raknet";
import { ComplexInventoryTransaction } from "bdsx/bds/inventory";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { AnimatePacket } from "bdsx/bds/packets";

let peer: RakNet.RakPeer;

events.serverOpen.on(() => {
	peer = bedrockServer.rakPeer;
});

const MismatchAuraWarn = new Map<string, number>();
const sameRotAuraWarn = new Map<string, number>();

const lastAttackpl: Record<string, string> = {};

const headRotWhereLookingAtInBodyWarn: Record<string, number[]> = {};

// function mismatchWarn(pl: pl): CANCEL {
// 	const name = pl.getName();

// 	if (MismatchAuraWarn.get(name) === undefined) {
// 		MismatchAuraWarn.set(name, 1);
// 		return CANCEL;
// 	};

// 	MismatchAuraWarn.set(name, MismatchAuraWarn.get(name)! + 1);

// 	setTimeout(async () => {
// 		MismatchAuraWarn.set(name, MismatchAuraWarn.get(name)! - 1);
// 		if (MismatchAuraWarn.get(name)! < 0) MismatchAuraWarn.set(name, 0);
// 	}, 3000);

// 	if (MismatchAuraWarn.get(name)! > 2) {
// 		CIF.ban(pl.getNetworkIdentifier(), "Aura-A");
// 		return CIF.detect(
// 			pl.getNetworkIdentifier(),
// 			"Aura-A",
// 			"Mismatch head rotation"
// 		);
// 	};

// 	return CANCEL;
// };

// function sameRotWarn(pl: pl): CANCEL {
// 	const name = pl.getName();
// 	if (sameRotAuraWarn.get(name) === undefined) {
// 		sameRotAuraWarn.set(name, 1);
// 	};

// 	sameRotAuraWarn.set(name, sameRotAuraWarn.get(name)! + 1);

// 	setTimeout(async () => {
// 		sameRotAuraWarn.set(name, sameRotAuraWarn.get(name)! - 1);
// 		if (sameRotAuraWarn.get(name)! < 0) sameRotAuraWarn.set(name, 0);
// 	}, 3000);

// 	if (sameRotAuraWarn.get(name)! > 3) {
// 		sameRotAuraWarn.set(name, 0);
// 		CIF.suspect(pl.getNetworkIdentifier(), "Aura-B", "Attacking Same Body Position");
// 	};

// 	return CANCEL;
// };

function degreesToRadians(degrees: number): number {
	return (degrees * Math.PI) / 180;
};

function getVectorByRotation(rotation: { x: number; y: number }): Vec3 {
	// const x = Math.cos(degreesToRadians(rotation.x));
	// const y = Math.sin(degreesToRadians(rotation.y));
	// const z = Math.sin(degreesToRadians(rotation.x));
	const x = Math.sin(degreesToRadians(rotation.x));
	const y = Math.sin(degreesToRadians(rotation.y));
	const z = Math.cos(degreesToRadians(rotation.x));

	return Vec3.create(x, y, z);
};

function isMismatchAttack(
	pl: ServerPlayer,
	victim: ServerPlayer,
	viewVector: Vec3 = pl.getViewVector(),
	distance: number | undefined = undefined
): boolean {
	const victimPos = victim.getFeetPos();
	victimPos.y += 0.9;

	const plPos = pl.getPosition();

	if (victimPos.distance(plPos) < 1) {
		return false;
	};

	let reach = plPos.distance(victimPos);

	if (distance) reach = distance;

	viewVector.multiply(reach);
	viewVector.x += plPos.x;
	viewVector.y += plPos.y;
	viewVector.z += plPos.z;

	const distanceX = Math.abs(viewVector.x - victimPos.x) / reach;
	const distanceZ = Math.abs(viewVector.z - victimPos.z) / reach;
	const hitRange = Math.sqrt(
		Math.pow(distanceX, 2) + Math.pow(distanceZ, 2)
	);

	if (hitRange > 1.25) {
		return true;
	};

	return false;
};


const instantSwingArmStack: Record<string, number> = {};
const instantTransactionStack: Record<string, number> = {};

events.packetBefore(MinecraftPacketIds.Animate).on((pkt, ni, pktid)=> {
	const pl = ni.getActor()!;
	const plname = pl.getName();
	
	if (pkt.action === AnimatePacket.Actions.SwingArm) instantSwingArmStack[plname]++;
});

events.packetBefore(MinecraftPacketIds.InventoryTransaction).on((pkt, ni, pktid)=> {
	const pl = ni.getActor()!;
	const plname = pl.getName();

	if (pkt.transaction?.type === ComplexInventoryTransaction.Type.ItemUseOnEntityTransaction) instantTransactionStack[plname]++;
	if (pkt.transaction?.type === ComplexInventoryTransaction.Type.ItemUseTransaction) instantTransactionStack[plname]--;
});

events.levelTick.on((ev)=> {
	const pls = ev.level.getPlayers();

	for (const pl of pls) {
		const plname = pl.getName();

		instantSwingArmStack[plname] = 0;
		instantTransactionStack[plname] = 0;
	};
});

events.playerAttack.on((ev) => {
	if (CIFconfig.Modules.combat) {

		const pl = ev.player;
		const plname = pl.getName()!;

		const vic = ev.victim;
		if (vic.isPlayer() && pl.getPlatform() === BuildPlatform.WINDOWS_10) {

			if (instantSwingArmStack[plname] === 1) {
				if (instantTransactionStack[plname] === 2) {
					instantSwingArmStack[plname] = 0;
					instantTransactionStack[plname] = 0;

					return CIF.failAndFlag(pl.getNetworkIdentifier(), "Aura-2C", "Invalid packet sequence (Prax Client)", 2);
				};

				if (instantTransactionStack[plname] === 1) {
					instantSwingArmStack[plname] = 0;
					instantTransactionStack[plname] = 0;

					return CIF.failAndFlag(pl.getNetworkIdentifier(), "Aura-1C", "Invalid packet sequence (Borion Client)", 4);
				};
			};

			if (instantSwingArmStack[plname] === 0) {
				if (instantTransactionStack[plname] === 1) {
					instantSwingArmStack[plname] = 0;
					instantTransactionStack[plname] = 0;

					return CIF.failAndFlag(pl.getNetworkIdentifier(), "Aura-1C", "Invalid packet sequence (Borion Client)", 4);
				};
			};

			instantSwingArmStack[plname] = 0;
			instantTransactionStack[plname] = 0;
		};

	
		const victim = ev.victim;
	
		if (!pl.isPlayer()) return;
		if (!victim.isPlayer()) return;
		if (victim.getGameType() === GameType.Creative) return;
		if (pl.getGameType() === GameType.Creative) return;
		if (victim.getEffect(MobEffectIds.InstantHealth) !== null) return;
	
		if (pl.getPlatform() !== BuildPlatform.ANDROID && pl.getPlatform() !== BuildPlatform.IOS) {
			const name = pl.getName()!;
	
			const prevRotations = lastRotations.get(name);
	
			if (prevRotations !== undefined && prevRotations.length === 3) {
	
				const check1 = isMismatchAttack(pl, victim);
				const check2 = isMismatchAttack(
					pl,
					victim,
					getVectorByRotation(prevRotations[1])
				);
	
				const check3 = isMismatchAttack(
					pl,
					victim,
					getVectorByRotation(prevRotations[2])
				);
	
				if (check1 && check2 && check3) {
					// return mismatchWarn(pl);
				} else if (check1) {
					return CANCEL;
				};
			};
		};
	
		const plpos = pl.getPosition();
	
		const plPing = peer.GetLastPing(pl.getNetworkIdentifier().address);
		const victimPing = peer.GetLastPing(victim.getNetworkIdentifier().address);
	
		const plViewVec = pl.getViewVector();
		const howManyMultiplyToSpeed = Math.max(Math.min(Math.round(plPing / 50), 20), 2);
	
		const speed = pl.getLastBPS() / 20;
		const howManyMultiplyToPos = howManyMultiplyToSpeed * speed;
	
		plpos.x += plViewVec.x * howManyMultiplyToPos;
		plpos.z += plViewVec.z * howManyMultiplyToPos;
	
		const victimpos =
			plpos.distance(lastPositions[victim.getName()][Math.min(Math.max(Math.round(victimPing / 50), 17) + 2, 3)])
				> plpos.distance(victim.getFeetPos()) ?
				victim.getFeetPos() : lastPositions[victim.getName()][Math.min(Math.max(Math.round(victimPing / 50), 17) + 2, 3)];
	
	
		const result1 = Math.pow(plpos.x - victimpos.x, 2);
		const result2 = Math.pow(plpos.z - victimpos.z, 2);
	
		const distance = Math.sqrt(result1 + result2);
	
		const headPos = pl.getPosition();
		const addThisPos = pl.getViewVector().multiply(distance);
	
		headPos.x += addThisPos.x;
		headPos.y += addThisPos.y;
		headPos.z += addThisPos.z;
	
		const headRotWhereLookingAt = headPos;
	
		const posFromVicHead = victim.getPosition().distance(headRotWhereLookingAt);
		const posFromVicFeet = victim.getFeetPos().distance(headRotWhereLookingAt);
	
		if (typeof headRotWhereLookingAtInBodyWarn[plname] !== "undefined") {
			const lastPosFromVicHead = headRotWhereLookingAtInBodyWarn[plname][0];
			const lastPosFromVicFeet = headRotWhereLookingAtInBodyWarn[plname][1];
	
			if (lastPosFromVicHead === posFromVicHead && posFromVicFeet === lastPosFromVicFeet && lastAttackpl[plname] === victim.getNameTag()
				&& !pl.getRotation().equals(Vec2.create(lastRotations.get(plname)![0]))) {
				headPos.x -= addThisPos.x;
				headPos.y -= addThisPos.y;
				headPos.z -= addThisPos.z;
				// return sameRotWarn(pl);
			};
		};
	
		headRotWhereLookingAtInBodyWarn[plname] = [posFromVicHead, posFromVicFeet];
	
		lastAttackpl[plname] = victim.getNameTag();
	
		const reach = Number(Math.sqrt(result1 + result2).toFixed(2)) - 0.4;
		pl.sendMessage(`` + reach);
		victim.sendMessage(`` + reach);
	
		if (
			reach > 3.01 &&
			reach < 8 &&
			!isMismatchAttack(pl, victim, pl.getViewVector(), reach)
		) {
			headPos.x -= addThisPos.x;
			headPos.y -= addThisPos.y;
			headPos.z -= addThisPos.z;
	
			return CIF.suspect(pl.getNetworkIdentifier(), "Reach", `Increases Reach | ${reach}`);
		};
	
		headPos.x -= addThisPos.x;
		headPos.y -= addThisPos.y;
		headPos.z -= addThisPos.z;

	};
});