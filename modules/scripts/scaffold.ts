import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { CIF } from "../../main";
import { CIFconfig } from "../util/configManager";


events.blockPlace.on((ev) => {
	if (CIFconfig.Modules.scaffold !== true) return;


	const player = ev.player;
	if (!player) return;
	if (!player.isPlayer()) return;

	const blockPos = ev.blockPos;
	const playerPos = player.getFeetPos()!;
	const plposy = Math.floor(playerPos.y);
	const blockposy = Math.floor(blockPos.y);
	const gm = player.getGameType();
	if (gm === 1) return;

	const headrotation = player.getRotation();
	const ni = player.getNetworkIdentifier()!;

	if ( headrotation.x === 60) {
		return CIF.failAndFlag(ni, "Scaffold-D", "The Y of head rotation is exactly 60", 2);
	};

	if (headrotation.x === 90) {
		return CIF.failAndFlag(ni, "Scaffold-E", "Tower : The Y of head rotation is exactly 90", 2);
	};	

	if (plposy - 1 === blockposy || plposy - 2 === blockposy) {
		if (headrotation.x < 0) return CIF.failAndFlag(ni, "Scaffold-A", "Mismatch Head Rotation | Up/Down", 3);
	};

});

events.itemUseOnBlock.on((ev) => {
	const pl = ev.actor;
	if (!pl?.isPlayer()) return;

	if (CIFconfig.Modules.scaffold) {

		const clickX = ev.clickX;
		const clickY = ev.clickY;
		const clickZ = ev.clickZ;

		if (!(clickX === 0 && clickY === 0 && clickZ === 0) && Number.isInteger(clickX) && Number.isInteger(clickY) && Number.isInteger(clickZ)) {
			return CIF.failAndFlag(pl.getNetworkIdentifier(), "Scaffold-C", "Invalid click position [Prax Client]", 3);
		};
	};
});
