import { command } from "bdsx/command";
import { events } from "bdsx/event";
import { bool_t } from "bdsx/nativetype";
import { CIFconfig, CIFconfigNames } from "./configManager";
import { bedrockServer } from "bdsx/launcher";
import { CIF } from "../../main";

enum isEnabled {
	Enabled = 1,
	Disabled = 0
};

events.serverOpen.on(()=> {
	const cmd = command.register("cif", "Manage all things about CIF", 1);

	cmd.overload((param) => {
		CIFconfig.Modules[param.configs] = param.isenabled;
		
		const onlineops = bedrockServer.serverInstance.getPlayers().filter(p => p.getCommandPermissionLevel() > 0);

		for (const onlineop of onlineops) {
			onlineop.sendMessage("§c[§fCIF§c] §d"+param.configs+` §e모듈이 ${isEnabled[Number(param.isenabled)]} 상태로 설정되었습니다`);
			onlineop.sendMessage("§c주의 : 이 설정은 임시적이며 서버 재시작시 초기화됩니다");
		};

		CIF.log(param.configs.magenta+`모듈이 ${isEnabled[Number(param.isenabled)].yellow} 상태로 설정되었습니다`);
		CIF.log("주의 : 이 설정은 임시적이며 서버 재시작시 초기화됩니다".red);
	}, {
		config : command.enum("config", "config"),
		configs : command.enum("cif_config", CIFconfigNames),
		isenabled : bool_t
	});
});