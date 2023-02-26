import { ActorDamageCause } from "bdsx/bds/actor";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { CIF } from "../main";

const reachWarn = new Map<NetworkIdentifier, number>();

function warn(ni: NetworkIdentifier): CANCEL {

    if (!reachWarn.get(ni)) reachWarn.set(ni, 0);

    reachWarn.set(ni, reachWarn.get(ni)! + 1);

    setTimeout(() => {
        reachWarn.set(ni, reachWarn.get(ni)! - 1);
    }, 5000);

    if (reachWarn.get(ni)! > 2) {
        CIF.detect(ni, "reach", "Increase Reach");
    };

    return CANCEL;
};

events.entityHurt.on((ev) => {
    const victim = ev.entity;
    const attacker = ev.damageSource.getDamagingEntity();
    if (!attacker) return;
    if (!attacker.isPlayer()) return;
    if (attacker.getGameType() === 1) return;

    if (ev.damageSource.cause === ActorDamageCause.Projectile) return;

    const attackerpos = attacker.getFeetPos();
    const victimpos = victim.getFeetPos();

    const result1 = Math.pow(attackerpos.x - victimpos.x, 2);
    const result2 = Math.pow(attackerpos.z - victimpos.z, 2);

    const reach = Math.sqrt(result1 + result2);
    // console.log(reach); debug
    if (reach > 4.75) {
        return warn(attacker.getNetworkIdentifier());
    };
});