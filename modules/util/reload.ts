import { CommandPermissionLevel } from "bdsx/bds/command";
import { command } from "bdsx/command";
import { events } from "bdsx/event";
import { exec } from "child_process";
import { CIF } from "../../main";
import { bedrockServer } from "bdsx/launcher";
import { CANCEL } from "bdsx/common";

const filePath = "../plugins/cif/modules/scripts/reloadedScript.ts";

let isLoading = false;

events.packetBefore(77).on((pkt, ni) => {
	const pl = ni.getActor()!;
	if (pl.getCommandPermissionLevel() > 0) {
		if (pkt.command === "/reload") {
			if (isLoading === true) {
				pl.sendMessage("§c현재 개발 스크립트가 로딩중에 있습니다");
				pl.sendMessage("§c잠시 후 다시 시도해주세요");
				return CANCEL;
			};

			isLoading = true;

			exec(`cmd /c tsc --strict ${filePath}`, ((err) => {
				CIF.announce(`§l${pl.getName()} §e> §dReloaded Development Script`);
				isLoading = false;
				require("../scripts/reloadedScript");
			}));
		};
	};
});

bedrockServer.afterOpen().then(() => {
	command.find("reload").signature.permissionLevel = CommandPermissionLevel.Operator;
});