import { events } from "bdsx/event";
import { dateWithZero } from "./implements";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { CANCEL } from "bdsx/common";

if (!existsSync("../CIFcrashLogs")) {
	mkdirSync("../CIFcrashLogs");
};

const UINTmax = 0xFFFFFFFF;
for (let i = 0; i < 200; i++) {

	events.packetRaw(i).on((ptr, size, ni, pktid)=> {

		ptr.move(1);

		try {
			if (ptr.readVarUint() >= UINTmax) {
				writeFileSync(`../CIFcrashLogs/${dateWithZero()}.log`, 
				"Crasher Detected : "+
				pktid+
				`\n${ni.getActor()?.getNameTag() || "Couldn't Get Name"}`+
				"packetRaw");
				return CANCEL;
			};
			
			if (ptr.readVarUint() >= UINTmax) {
				writeFileSync(`../CIFcrashLogs/${dateWithZero()}.log`, 
				"Crasher Detected : "+
				pktid+
				`\n${ni.getActor()?.getNameTag() || "Couldn't Get Name"}`+
				"packetRaw");
				return CANCEL;
			};

			if (ptr.readVarUint() >= UINTmax) {
				writeFileSync(`../CIFcrashLogs/${dateWithZero()}.log`, 
				"Crasher Detected : "+
				pktid+
				`\n${ni.getActor()?.getNameTag() || "Couldn't Get Name"}`+
				"packetRaw");
				return CANCEL;
			};

			if (ptr.readVarUint() >= UINTmax) {
				writeFileSync(`../CIFcrashLogs/${dateWithZero()}.log`, 
				"Crasher Detected : "+
				pktid+
				`\n${ni.getActor()?.getNameTag() || "Couldn't Get Name"}`+
				"packetRaw");
				return CANCEL;
			};

			if (ptr.readVarUint() >= UINTmax) {
				writeFileSync(`../CIFcrashLogs/${dateWithZero()}.log`, 
				"Crasher Detected : "+
				pktid+
				`\n${ni.getActor()?.getNameTag() || "Couldn't Get Name"}`+
				"packetRaw");
				return CANCEL;
			};
		} catch {};
	});

};