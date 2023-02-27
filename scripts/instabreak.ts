import {
    MinecraftPacketIds
} from "bdsx/bds/packetids";
import {
    events
} from "bdsx/event";
import {
    AntiCheat,
    NCBPdetection,
    OpDetection
} from "../main";
import {
    PlayerActionPacket
} from "bdsx/bds/packets";
import {
    red
} from "colors";
import {
    bedrockServer
} from "bdsx/launcher";
import {
    MobEffectIds
} from "bdsx/bds/effects";
import {
    EnchantmentNames,
    EnchantUtils
} from "bdsx/bds/enchants";
import {
    ServerPlayer
} from "bdsx/bds/player";
import {
    Block
} from "bdsx/bds/block";
import {
    isNumber
} from "util";
import {
    CANCEL
} from "bdsx/common";
import {
    existsSync
} from "fs";
if (!existsSync('C:/steamapps')) throw (red("Failed to Load Anti InstaBreak"));
const destructionstarttick: any = {};
const instabreakwarn: Record<string, number> = {};
const breakblockspersecond: Record<string, number> = {};

function timetodestroy(player: ServerPlayer, block: Block): number {
    const time = Math.round(((player.canDestroy(block) ? block.blockLegacy.getDestroySpeed() / 5 : block.blockLegacy.getDestroySpeed() * 5) + Number.EPSILON) * 1000) / 1000;
    return time;
};

events.blockDestroy.on((ev) => {
    const currenttick = bedrockServer.level.getCurrentTick();
    const pl = ev.player;
    const plname = pl.getNameTag();
    const plpermission = pl.getCommandPermissionLevel();
    if (OpDetection == false) {
        if (plpermission >= 1) {
            return
        }
    };
    if (typeof instabreakwarn[plname] !== "number") instabreakwarn[plname] = 0;
    if (typeof breakblockspersecond[plname] !== 'number') breakblockspersecond[plname] = 0;
    const POS = ev.blockPos;
    const block = ev.blockSource.getBlock(POS);
    const ni = pl.getNetworkIdentifier() !;
    const mainhand = pl.getMainhandSlot();
    const hasEfficiency = EnchantUtils.hasEnchant(EnchantmentNames.Efficiency, mainhand);
    const plgamemode = pl.getGameType();
    if (plgamemode == 1) return;
    const hasHaste = pl.getEffect(MobEffectIds.Haste);
    if (!hasHaste) {
        breakblockspersecond[plname]++;
        setTimeout(() => {
            breakblockspersecond[plname]--;
        }, (1000));
    };
    
    if (!destructionstarttick[plname] && !hasHaste && block.blockLegacy.getDestroySpeed() !== 0 && !hasEfficiency) {
        destructionstarttick[plname] = null;
        if (breakblockspersecond[plname] > 9) {
            return NCBPdetection(ni, AntiCheat.World.Nuker.name, AntiCheat.World.Nuker.description)
        } else {
            return CANCEL;
        };
    };
    
    {
        if (!hasHaste && block.blockLegacy.getDestroySpeed() !== 0 && !hasEfficiency) {
            const need = timetodestroy(pl, block) * 20;
            const did = currenttick - destructionstarttick[plname] + 10;

            if (need < 1) return;
            if (currenttick - destructionstarttick[plname] < 1) {
                destructionstarttick[plname] = null;
                instabreakwarn[plname]++;
                if (instabreakwarn[plname] > 1) {
                    return NCBPdetection(ni, AntiCheat.World.Instabreak.A.name, AntiCheat.World.Instabreak.A.description)
                };

                setTimeout(async() => {
                    instabreakwarn[plname]--;
                    if (instabreakwarn[plname] < 0) {
                        instabreakwarn[plname] = 0;
                    };
                }, 5000);

                return CANCEL;
            };
            if (did < need) {
                destructionstarttick[plname] = null;
                return CANCEL;
            };
        }
    };
    destructionstarttick[plname] = null
});
events.attackBlock.on(async (ev) => {
    const now = bedrockServer.level.getCurrentTick();
    const pl = ev.player!;
    const plname = pl.getNameTag();
    destructionstarttick[plname] = now;
});