import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { dateWithZero } from "./implements";

let LastDateString = "";

dateWithZero();

process.on("beforeExit", ((exitCode)=> {
	console.log("before " + exitCode);
}));

process.on("exit", ((exitCode)=> {
	console.log("exit " + exitCode);
}))

for (let i = 0; i < 200; i++) {
	if (i === MinecraftPacketIds.Login) continue;
	if (i === MinecraftPacketIds.RequestNetworkSettings) continue;
	events.packetRaw(i).on((ptr, size, ni)=> {
		
	});
};

//It's on Developing