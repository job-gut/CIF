import { bedrockServer } from "bdsx/launcher";
import { CIFVersion, getNewVersion, getWhatsNew, thisACisLastestVersion } from "../..";
import { CIF } from "../../main";

export async function alertAboutUpdates(): Promise<void> {
	if (await thisACisLastestVersion() === false) {
		const developer = bedrockServer.serverInstance.getPlayers().filter(
			p => p.getName() === "jobgutworlds" && p.getCommandPermissionLevel() < 1);

		developer[0].sendMessage(`§c[§fCIF§c] §l§4※§r§d해당 서버는 CIF가 현재 최신버전이 아닙니다§l§4※`);
		developer[0].sendMessage(`§c[§fCIF§c] §7현재 버전: ${CIFVersion} §l§f-> §r§b최신 버전: ${await getNewVersion()}`);

		CIF.announce("§l§4※§r§dCIF가 현재 최신버전이 아닙니다§l§4※");
		CIF.announce("§e/cif update 로 업데이트 할 수 있습니다");
		CIF.announce(`§7현재 버전: ${CIFVersion} §l§f-> §r§b최신 버전: ${await getNewVersion()}`);
		CIF.announce("§6변경 사항: §a" + await getWhatsNew());

		CIF.log("CIF 가 현재 최신 버전이 아닙니다".bgRed);
		CIF.log("cif update 로 업데이트 할 수 있습니다".bgRed);
		CIF.log(`현재 버전: ${CIFVersion} -> 최신 버전: ${await getNewVersion()}`.magenta);
		CIF.log("변경 사항: ".yellow + (await getWhatsNew()).green);

		return;
	};

	if (await thisACisLastestVersion() === true) {
		CIF.announce("§aCIF가 현재 최신버전입니다");
		CIF.announce(`§7현재 버전: ${CIFVersion}`);

		CIF.log("CIF 가 현재 최신버전입니다".green);
		CIF.log(`현재 버전: ${CIFVersion}`.magenta);

		return;
	};

	if (await thisACisLastestVersion() === undefined) {
		const developer = bedrockServer.serverInstance.getPlayers().filter(
			p => p.getName() === "jobgutworlds" && p.getCommandPermissionLevel() < 1);

		developer[0].sendMessage(`§c[§fCIF§c] CIF 메인 서버에 연결할 수 없습니다`);
		developer[0].sendMessage(`§c[§fCIF§c] §7현재 버전: ${CIFVersion}`);
		
		CIF.announce("CIF 메인 서버에 연결할 수 없습니다");
		CIF.announce(`§7현재 버전: ${CIFVersion}`);

		CIF.log("CIF 메인 서버에 연결할 수 없습니다".red);
		CIF.log(`현재 버전: ${CIFVersion}`.magenta);

		return;
	};
};

setInterval(() => {
	alertAboutUpdates();
}, 1000 * 60 * 5).unref();