import { bedrockServer } from "bdsx/launcher";
import { CIFVersion, getNewVersion, getWhatsNew, thisACisLastestVersion, update } from "../..";
import { CIF } from "../../main";
import { CIFconfig } from "./configManager";

export async function alertAboutUpdates(): Promise<void> {
	if (await thisACisLastestVersion() === false && CIFconfig.Modules.auto_update === false) {
		const developer = bedrockServer.serverInstance.getPlayers().filter(p => p.getName() === "jobgutworlds" && p.getCommandPermissionLevel() < 1);

		developer[0]?.sendMessage(`§c[§fCIF§c] §l§4※§r§d해당 서버는 CIF가 현재 최신버전이 아닙니다§l§4※`);
		developer[0]?.sendMessage(`§c[§fCIF§c] §7현재 버전: ${CIFVersion} §l§f-> §r§b최신 버전: ${await getNewVersion()}`);

		CIF.announce("§l§4※§r§dCIF is not up to date§l§4※");
		CIF.announce("§eYou can update with '/cif update' command");
		CIF.announce(`§7Current Ver: ${CIFVersion} §l§f-> §r§bLatest Ver: ${await getNewVersion()}`);
		CIF.announce("§6Changes: §a" + await getWhatsNew());

		CIF.log("CIF is not up to date".bgRed);
		CIF.log("You can update with 'cif update' command".bgRed);
		CIF.log(`Current Ver: ${CIFVersion} -> Latest Ver: ${await getNewVersion()}`.magenta);
		CIF.log("Changes: ".yellow + (await getWhatsNew()).green);

		return;
	} else if (await thisACisLastestVersion() === false && CIFconfig.Modules.auto_update === true) {
		const developer = bedrockServer.serverInstance.getPlayers().filter(p => p.getName() === "jobgutworlds" && p.getCommandPermissionLevel() < 1);

		developer[0]?.sendMessage(`§c[§fCIF§c] §l§aCIF 업데이트를 시도합니다`);
		developer[0]?.sendMessage(`§c[§fCIF§c] §7현재 버전: ${CIFVersion} §l§f-> §r§b최신 버전: ${await getNewVersion()}`);

		update();

		CIF.announce(`§7Before Ver: ${CIFVersion} §l§f-> §r§bNow Ver: ${await getNewVersion()}`);
		CIF.announce("§6Changes: §a" + await getWhatsNew());

		CIF.log(`Before Ver: ${CIFVersion} -> Now Ver: ${await getNewVersion()}`.magenta);
		CIF.log("Changed: ".yellow + (await getWhatsNew()).green);

		return;
	};

	if (await thisACisLastestVersion() === true) {
		CIF.announce("§aCIF is up to date");
		CIF.announce(`§7Current Ver: ${CIFVersion}`);

		CIF.log("CIF is up to date".green);
		CIF.log(`Current Ver: ${CIFVersion}`.magenta);

		return;
	};

	if (await thisACisLastestVersion() === undefined) {
		const developer = bedrockServer.serverInstance.getPlayers().filter(p => p.getName() === "jobgutworlds" && p.getCommandPermissionLevel() < 1);

		developer[0]?.sendMessage(`§c[§fCIF§c] CIF 메인 서버에 연결할 수 없습니다`);
		developer[0]?.sendMessage(`§c[§fCIF§c] §7현재 버전: ${CIFVersion}`);
		
		return;
	};
};

setInterval(() => {
	alertAboutUpdates();
}, 1000 * 60 * 5).unref();