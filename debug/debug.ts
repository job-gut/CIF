import { CommandMessage, CommandPermissionLevel, PlayerCommandSelector } from "bdsx/bds/command";
import { ServerPlayer } from "bdsx/bds/player";
import { command } from "bdsx/command";
import { events } from "bdsx/event";
import { CIF } from "../main";
import { CIFconfig, CIFconfigNames } from "../modules/util/configManager";
import { bool_t } from "bdsx/nativetype";

//debug code
events.serverOpen.on(() => {
    const debugCommand = command.register('cif_dbg', 'command for testing some CIF modules', CommandPermissionLevel.Operator);
    debugCommand.overload((param, origin, output) => {
        CIF.announce(param.message.getMessage(origin), param.target);
    }, {
        announce: command.enum("announce", "announce"),
        message: CommandMessage,
        target: [command.enum("target", CommandPermissionLevel), true]
    });
    debugCommand.overload((param, origin, output) => {
        CIF.log(param.message.getMessage(origin));
    }, {
        log: command.enum("log", "log"),
        message: CommandMessage
    });
    debugCommand.overload((param, origin, output) => {
        let player: any = param.target.newResults(origin, ServerPlayer);
        if (player.length !== 1) return output.error("한명을 선택해주세요");
        player = player[0];
        CIF.ban(player.getNetworkIdentifier(), param.reason.getMessage(origin));
    }, {
        ban: command.enum("ban", "ban"),
        target: PlayerCommandSelector,
        reason: CommandMessage
    });
    debugCommand.overload((param, origin, output) => {
        let player: any = param.target.newResults(origin, ServerPlayer);
        if (player.length !== 1) return output.error("한명을 선택해주세요");
        player = player[0];
        CIF.detect(player.getNetworkIdentifier(), param.cheatName.getMessage(origin), param.cheatDescription.getMessage(origin));
    }, {
        detect: command.enum("detect", "detect"),
        target: PlayerCommandSelector,
        cheatName: CommandMessage,
        cheatDescription: CommandMessage
    });
});