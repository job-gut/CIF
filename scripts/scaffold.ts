import { CANCEL } from "bdsx/common";
import {
    events
} from "bdsx/event";
import { isNumber } from "util";
import {
    CIF
} from "../main";

const lastplacedblockposY: any = {};
const scaffoldwarn: Record<string, number> = {};

events.blockPlace.on((ev) => {
    const pl = ev.player;
    if (!pl) return CANCEL;
    if (!pl.isPlayer()) return;
    const blockpos = ev.blockPos;
    const plpos = pl.getFeetPos()!;
    const plname = pl.getNameTag()!;
    const plposy = Math.floor(plpos.y);
    const blockposy = Math.floor(blockpos.y);
    const gm = pl.getGameType();
    if (gm === 1) return;

    if (plposy - 1 === blockposy || plposy - 2 === blockposy) {
        lastplacedblockposY[plname] = blockposy;

        const headrotation = pl.getRotation();
        const ni = pl.getNetworkIdentifier()!;
        if (headrotation.x < 0) {

            if (!isNumber(scaffoldwarn[plname])) scaffoldwarn[plname] = 0;
            scaffoldwarn[plname]++;

            if (scaffoldwarn[plname] > 2) {
                return CIF.detect(ni, "scaffold", "Mismatch Head Rotation");
            };

            setTimeout(async () => {
                scaffoldwarn[plname]--;
                if (scaffoldwarn[plname] < 0) scaffoldwarn[plname] = 0;
            }, 15000);

            return CANCEL;
        };

        if (headrotation.x < 30) {
            if (lastplacedblockposY[plname] + 1 === blockposy) {
                if (!isNumber(scaffoldwarn[plname])) scaffoldwarn[plname] = 0;
                scaffoldwarn[plname]++;

                if (scaffoldwarn[plname] > 1) {
                    return CIF.detect(ni, "scaffold", "Tower : Mismatch Head Rotation");
                };

                setTimeout(() => {
                    scaffoldwarn[plname]--;
                    if (scaffoldwarn[plname] < 0) scaffoldwarn[plname] = 0;
                }, 15000);
                return CANCEL;
            };
        };
    };
});