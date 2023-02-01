"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const packetids_1 = require("bdsx/bds/packetids");
const packets_1 = require("bdsx/bds/packets");
const event_1 = require("bdsx/event");
const main_1 = require("../main");
event_1.events.packetBefore(packetids_1.MinecraftPacketIds.ActorEvent).on((pkt, ni) => {
    const action = pkt.event;
    if (action === packets_1.ActorEventPacket.Events.PlayerAddXpLevels) {
        main_1.CIF.ban(ni, "xp");
        return main_1.CIF.detect(ni, "xp", "Fake PlayerAddXpLevels Packet");
    }
    ;
});
event_1.events.packetBefore(packetids_1.MinecraftPacketIds.SpawnExperienceOrb).on((pkt, ni) => {
    main_1.CIF.ban(ni, "xp");
    return main_1.CIF.detect(ni, "xp", "Summon XP Orbs");
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieHAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ4cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGtEQUF3RDtBQUN4RCw4Q0FBb0Q7QUFDcEQsc0NBQW9DO0FBQ3BDLGtDQUE4QjtBQUU5QixjQUFNLENBQUMsWUFBWSxDQUFDLDhCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUMsRUFBRTtJQUM3RCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDO0lBQ3pCLElBQUksTUFBTSxLQUFLLDBCQUFnQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRTtRQUN0RCxVQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNsQixPQUFPLFVBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO0tBQ2hFO0lBQUEsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDO0FBRUgsY0FBTSxDQUFDLFlBQVksQ0FBQyw4QkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUMsRUFBRTtJQUNyRSxVQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNsQixPQUFPLFVBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ2xELENBQUMsQ0FBQyxDQUFDIn0=