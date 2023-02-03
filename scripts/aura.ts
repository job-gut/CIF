import { GameType, Player } from "bdsx/bds/player";
import { BuildPlatform, CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { CIF } from "../main";

const aruaWarn = new Map<string, number>();

function warn(player: Player) {
    const name = player.getNameTag();
    if (aruaWarn.get(name) === undefined) {
        aruaWarn.set(name, 1);
        return;
    }
    aruaWarn.set(name, aruaWarn.get(name)! + 1);
    setTimeout(async () => {
        aruaWarn.set(name, aruaWarn.get(name)! - 1);
        if (aruaWarn.get(name)! < 0) aruaWarn.set(name, 0);
    }, 5000);
    if (aruaWarn.get(name)! > 5) {
        CIF.detect(player.getNetworkIdentifier(), "killaura", "Unexpected hitting with Killaura");
    }
}

events.playerAttack.on((ev) => {
    if (!ev.victim.isPlayer()) return;
    if (ev.player.getGameType() === GameType.Creative) return;
    if (ev.player.getPlatform() === BuildPlatform.ANDROID || ev.player.getPlatform() === BuildPlatform.IOS) return;

    if (!ev.player.canSee(ev.victim)) {
        warn(ev.player);
        return;
    }

    const victimPos = ev.victim.getFeetPos();
    victimPos.y += 0.9;
    const playerPos = ev.player.getPosition();

    if (victimPos.distance(playerPos) < 1) {
        return;
    }

    let reach = playerPos.distance(victimPos);
    const viewVector = ev.player.getViewVector();
    viewVector.multiply(reach);
    viewVector.x += playerPos.x;
    viewVector.y += playerPos.y;
    viewVector.z += playerPos.z;
    const distanceX = Math.abs(viewVector.x - victimPos.x) / reach;
    const distanceZ = Math.abs(viewVector.z - victimPos.z) / reach;
    const hitRange = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceZ, 2));
    if (hitRange > 0.81) {
        warn(ev.player);
        return CANCEL;
    }
});