import { events } from "bdsx/event";
import { dateWithZero } from "./implements";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { CANCEL } from "bdsx/common";
import { CIF } from "../../main";

if (!existsSync("../CIFcrasherLogs")) {
	mkdirSync("../CIFcrasherLogs");
};

const UINTmax = 0xFFFFFFFF;
for (let i = 0; i < 200; i++) {
	if (i === 36) continue;
	if (i === 44) continue;
	
	events.packetRaw(i).on((ptr, size, ni, pktid)=> {

		ptr.move(1);

		try {
			if (ptr.readVarUint() >= UINTmax) {
				writeFileSync(`../CIFcrasherLogs/${dateWithZero()}.log`, 
				"Crasher Detected : "+
				pktid+
				`\n${ni.getActor()?.getName() || "Couldn't Get Name"}`+
				"\npacketRaw");
				CIF.log(ni.getActor()?.getName() + " could try to crash server");
				CIF.announce(ni.getActor()?.getName() + " could try to crash server");
				return CANCEL;
			};

			if (ptr.readVarUint() >= UINTmax) {
				writeFileSync(`../CIFcrasherLogs/${dateWithZero()}.log`, 
				"Crasher Detected : "+
				pktid+
				`\n${ni.getActor()?.getName() || "Couldn't Get Name"}`+
				"\npacketRaw");
				CIF.log(ni.getActor()?.getName() + " could try to crash server");
				CIF.announce(ni.getActor()?.getName() + " could try to crash server");
				return CANCEL;
			};

			if (ptr.readVarUint() >= UINTmax) {
				writeFileSync(`../CIFcrasherLogs/${dateWithZero()}.log`, 
				"Crasher Detected : "+
				pktid+
				`\n${ni.getActor()?.getName() || "Couldn't Get Name"}`+
				"\npacketRaw");
				CIF.log(ni.getActor()?.getName() + " could try to crash server");
				CIF.announce(ni.getActor()?.getName() + " could try to crash server");
				return CANCEL;
			};

			if (ptr.readVarUint() >= UINTmax) {
				writeFileSync(`../CIFcrasherLogs/${dateWithZero()}.log`, 
				"Crasher Detected : "+
				pktid+
				`\n${ni.getActor()?.getName() || "Couldn't Get Name"}`+
				"\npacketRaw");
				CIF.log(ni.getActor()?.getName() + " could try to crash server");
				CIF.announce(ni.getActor()?.getName() + " could try to crash server");
				return CANCEL;
			};

			if (ptr.readVarUint() >= UINTmax) {
				writeFileSync(`../CIFcrasherLogs/${dateWithZero()}.log`, 
				"Crasher Detected : "+
				pktid+
				`\n${ni.getActor()?.getName() || "Couldn't Get Name"}`+
				"\npacketRaw");
				CIF.log(ni.getActor()?.getName() + " could try to crash server");
				CIF.announce(ni.getActor()?.getName() + " could try to crash server");
				return CANCEL;
			};

			if (size >= UINTmax) {
				writeFileSync(`../CIFcrasherLogs/${dateWithZero()}.log`, 
				"Crasher Detected : "+
				pktid+
				`\n${ni.getActor()?.getName() || "Couldn't Get Name"}`+
				"\npacketRaw");
				CIF.log(ni.getActor()?.getName() + " could try to crash server");
				CIF.announce(ni.getActor()?.getName() + " could try to crash server");
				return CANCEL;
			};
		} catch {};
	});

};