import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { CIF } from "../main";

const lastplacedblockposY: any = {};
const scaffoldWarn: Record<string, number> = {};

function warn(name: string) {
    if (typeof scaffoldWarn[name] !== "number") scaffoldWarn[name] = 0;
    scaffoldWarn[name]++;

    setTimeout(() => {
        scaffoldWarn[name]--;
        if (scaffoldWarn[name] < 0) {
            scaffoldWarn[name] = 0;
        };
    }, 5000);
}

events.blockPlace.on((ev) => {
    const player = ev.player;
    if (!player) return CANCEL;
    if (!player.isPlayer()) return;
    const blockPos = ev.blockPos;
    const playerPos = player.getFeetPos()!;
    const name = player.getName()!;
    const plposy = Math.floor(playerPos.y);
    const blockposy = Math.floor(blockPos.y);
    const gm = player.getGameType();
    if (gm === 1) return;

    if (plposy - 1 === blockposy || plposy - 2 === blockposy) {
        lastplacedblockposY[name] = blockposy;

        const headrotation = player.getRotation();
        const ni = player.getNetworkIdentifier()!;
        if (headrotation.x < 0) {

            warn(name);

            if (scaffoldWarn[name] > 2) {
                return CIF.detect(ni, "scaffold-A", "Mismatch Head Rotation (x)");
            };

            setTimeout(async () => {
                scaffoldWarn[name]--;
                if (scaffoldWarn[name] < 0) scaffoldWarn[name] = 0;
            }, 15000);

            return CANCEL;
        };

        if (headrotation.x < 30) {
            if (lastplacedblockposY[name] + 1 === blockposy) {
                warn(name);

                if (scaffoldWarn[name] > 1) {
                    return CIF.detect(ni, "scaffold-B", "Tower : Mismatch Head Rotation");
                };

                setTimeout(() => {
                    scaffoldWarn[name]--;
                    if (scaffoldWarn[name] < 0) scaffoldWarn[name] = 0;
                }, 15000);
                return CANCEL;
            };
        };

        const distanceX = Math.abs(blockPos.x - playerPos.x);
        const distanceY = Math.abs(blockPos.y - playerPos.y);
        const viewVector = player.getViewVector();
        const vectorX = viewVector.x;
        const vectorY = viewVector.y;
        if (distanceX < distanceY !== vectorX > vectorY) {
            warn(name);
            if (scaffoldWarn[name] > 1) {
                return CIF.detect(ni, "scaffold-C", "Mismatch Head Rotation (x, z)");
            };
        }
    };
});