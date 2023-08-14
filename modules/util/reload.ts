import { events } from "bdsx/event";
import { exec } from "child_process";

events.packetBefore(77).on((pkt, ni) => {
    const pl = ni.getActor()!;
    if (pl.getCommandPermissionLevel() > 0)
        if (pkt.command === "/reload") {
			exec("tsc --strict ../plugins/cif/modules/scripts/reloadedScript.ts", ((err)=> {
				if (err) throw err;
				require("../scripts/reloadedScript");
			}));
    	};
});