import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { CIF } from "../../main";
import { CIFconfig } from "../util/configManager";

const lastplacedblockposY: any = {};
const scaffoldWarn: Record<string, number> = {};

const placesPerSecond: Record<string, number> = {};

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
	if (CIFconfig.Modules.scaffold !== true) return;


	const player = ev.player;
	if (!player) return;
	if (!player.isPlayer()) return;
	const name = player.getName()!;
	const blockPos = ev.blockPos;
	const playerPos = player.getFeetPos()!;
	const plposy = Math.floor(playerPos.y);
	const blockposy = Math.floor(blockPos.y);
	const gm = player.getGameType();
	if (gm === 1) return;

	if (plposy - 1 === blockposy || plposy - 2 === blockposy) {

		const headrotation = player.getRotation();
		const ni = player.getNetworkIdentifier()!;
		if (headrotation.x < 0) {

			warn(name);

			if (scaffoldWarn[name] > 2) {
				return CIF.detect(ni, "Scaffold-A", "Mismatch Head Rotation | Up/Down");
			};

			setTimeout(async () => {
				scaffoldWarn[name]--;
				if (scaffoldWarn[name] < 0) scaffoldWarn[name] = 0;
			}, 15000);

			return CANCEL;
		};

		if (headrotation.x < 0) {
			if (lastplacedblockposY[name] + 1 === blockposy) {
				warn(name);

				if (scaffoldWarn[name] > 1) {
					return CIF.detect(ni, "Scaffold-B", "Tower : Mismatch Head Rotation");
				};

				setTimeout(() => {
					scaffoldWarn[name]--;
					if (scaffoldWarn[name] < 0) scaffoldWarn[name] = 0;
				}, 15000);
				return CANCEL;
			};
		};

		lastplacedblockposY[name] = blockposy;
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
			return CIF.failAndFlag(pl.getNetworkIdentifier(), "Scaffold-C", "Invalid click position (Prax Client)", 3);
		};
	};
});