import { Vec3 } from "bdsx/bds/blockpos";
import { GameType, Player, ServerPlayer } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { CIF } from "../../main";
import { lastRotations } from "./movement";
import { CIFconfig } from "../util/configManager";
import { ActorDamageCause } from "bdsx/bds/actor";
import { MobEffectIds } from "bdsx/bds/effects";

if (CIFconfig.Modules.combat === true) {
    const MismatchAuraWarn = new Map<string, number>();
    const sameRotAuraWarn = new Map<string, number>();

    const headRotWhereLookingAtInBodyWarn: Record<string, number[]> = {};

    function mismatchWarn(player: Player): CANCEL {
        const name = player.getName();

        if (MismatchAuraWarn.get(name) === undefined) {
            MismatchAuraWarn.set(name, 1);
            return CANCEL;
        };

        MismatchAuraWarn.set(name, MismatchAuraWarn.get(name)! + 1);

        setTimeout(async () => {
            MismatchAuraWarn.set(name, MismatchAuraWarn.get(name)! - 1);
            if (MismatchAuraWarn.get(name)! < 0) MismatchAuraWarn.set(name, 0);
        }, 3000);

        if (MismatchAuraWarn.get(name)! > 2) {
            CIF.ban(player.getNetworkIdentifier(), "Aura-A");
            return CIF.detect(
                player.getNetworkIdentifier(),
                "Aura-A",
                "Mismatch head rotation"
            );
        };

        return CANCEL;
    };

    function sameRotWarn(player: Player): CANCEL {
        const name = player.getName();
        if (sameRotAuraWarn.get(name) === undefined) {
            sameRotAuraWarn.set(name, 1);
        };

        sameRotAuraWarn.set(name, sameRotAuraWarn.get(name)! + 1);

        setTimeout(async () => {
            sameRotAuraWarn.set(name, sameRotAuraWarn.get(name)! - 1);
            if (sameRotAuraWarn.get(name)! < 0) sameRotAuraWarn.set(name, 0);
        }, 3000);

        if (sameRotAuraWarn.get(name)! > 3) {
            CIF.ban(player.getNetworkIdentifier(), "Aura-B");
            return CIF.detect(
                player.getNetworkIdentifier(),
                "Aura-B",
                "Same Body Pos Where Player Looking at"
            );
        };

        return CANCEL;
    };

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
        player: ServerPlayer,
        victim: ServerPlayer,
        viewVector: Vec3 = player.getViewVector(),
        distance: number | undefined = undefined
    ): boolean {
        const victimPos = victim.getFeetPos();
        victimPos.y += 0.9;

        const playerPos = player.getPosition();

        if (victimPos.distance(playerPos) < 1) {
            return false;
        };

        let reach = playerPos.distance(victimPos);

        if (distance) reach = distance;

        viewVector.multiply(reach);
        viewVector.x += playerPos.x;
        viewVector.y += playerPos.y;
        viewVector.z += playerPos.z;

        const distanceX = Math.abs(viewVector.x - victimPos.x) / reach;
        const distanceZ = Math.abs(viewVector.z - victimPos.z) / reach;
        const hitRange = Math.sqrt(
            Math.pow(distanceX, 2) + Math.pow(distanceZ, 2)
        );

        if (hitRange > 1) {
            return true;
        };

        return false;
    };


    events.playerAttack.on((ev) => {
        const victim = ev.victim;
        if (!victim.isPlayer()) return;
        if (ev.player.getGameType() === GameType.Creative) return;
        //if (ev.player.getPlatform() === BuildPlatform.ANDROID || ev.player.getPlatform() === BuildPlatform.IOS) return;

        const player = ev.player as ServerPlayer;
        const name = player.getName()!;

        const prevRotations = lastRotations.get(name);

        if (prevRotations === undefined || prevRotations.length !== 3) return;

        const check1 = isMismatchAttack(player, victim);
        const check2 = isMismatchAttack(
            player,
            victim,
            getVectorByRotation(prevRotations[1])
        );

        const check3 = isMismatchAttack(
            player,
            victim,
            getVectorByRotation(prevRotations[2])
        );

        if (check1 && check2 && check3) {
            return mismatchWarn(player);
        } else if (check1) {
            return CANCEL;
        };
    });

    events.entityHurt.on((ev) => {
        const cuz = ev.damageSource.cause;

        if (cuz !== ActorDamageCause.EntityAttack) return;

        const player = ev.damageSource.getDamagingEntity()! as ServerPlayer;
        const plname = player.getName();

        const victim = ev.entity;

        if (!player.isPlayer()) return;
        if (!victim.isPlayer()) return;
        if (victim.getGameType() === GameType.Creative) return;
        if (victim.getEffect(MobEffectIds.InstantHealth) !== null) return;

        const playerpos = player.getFeetPos();
        const victimpos = victim.getFeetPos();

        const result1 = Math.pow(playerpos.x - victimpos.x, 2);
        const result2 = Math.pow(playerpos.z - victimpos.z, 2);

        const distance = Math.sqrt(result1 + result2);

        const headPos = player.getPosition();
        const addThisPos = player.getViewVector().multiply(distance);

        headPos.x += addThisPos.x;
        headPos.y += addThisPos.y;
        headPos.z += addThisPos.z;

        const headRotWhereLookingAt = headPos;

        const posFromVicHead = victim.getPosition().distance(headRotWhereLookingAt);
        const posFromVicFeet = victimpos.distance(headRotWhereLookingAt);

        if (typeof headRotWhereLookingAtInBodyWarn[plname] !== "undefined") {
            const lastPosFromVicHead = headRotWhereLookingAtInBodyWarn[plname][0];
            const lastPosFromVicFeet = headRotWhereLookingAtInBodyWarn[plname][1];

            if (lastPosFromVicHead === posFromVicHead && posFromVicFeet && lastPosFromVicFeet) {
                return sameRotWarn(player);
            };
        };

        headRotWhereLookingAtInBodyWarn[plname] = [posFromVicHead, posFromVicFeet];

        const reach = Number(Math.sqrt(result1 + result2).toFixed(2));

        if (
            reach >= 4.5 &&
            !isMismatchAttack(player, victim, player.getViewVector(), reach)
        ) {
            CIF.announce(`§c[§fCIF§c] §c${plname} §6has failed to using §cReach §7(Increase Reach | ${reach})`);
            return CANCEL;
        };
    });
};