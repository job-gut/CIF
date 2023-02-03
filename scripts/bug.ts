import { ActorDamageCause } from "bdsx/bds/actor";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";

events.entityHurt.on((ev)=> {
    if (ev.damageSource.cause === ActorDamageCause.Fall) {
        if (ev.entity.isPlayer() && ev.entity.onGround()) {
            return CANCEL;
        };
    };
});