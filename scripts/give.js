"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const packetids_1 = require("bdsx/bds/packetids");
const event_1 = require("bdsx/event");
const main_1 = require("../main");
event_1.events.packetRaw(packetids_1.MinecraftPacketIds.InventoryTransaction).on((ptr, size, ni) => {
    ptr.move(1);
    try {
        for (let i = 0; i < size; i++) {
            if (ptr.readVarUint() === 99999) {
                main_1.CIF.ban(ni, "give");
                return main_1.CIF.detect(ni, "give", "Fake InventoryTransaction Packet");
            }
            ;
        }
        ;
    }
    catch (_a) { }
    ;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxrREFBd0Q7QUFDeEQsc0NBQW9DO0FBQ3BDLGtDQUE4QjtBQUU5QixjQUFNLENBQUMsU0FBUyxDQUFDLDhCQUFrQixDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUMsRUFBRTtJQUMxRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osSUFBSTtRQUNBLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDM0IsSUFBSSxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUssS0FBSyxFQUFFO2dCQUM3QixVQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDbkIsT0FBTyxVQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsa0NBQWtDLENBQUMsQ0FBQzthQUNyRTtZQUFBLENBQUM7U0FDTDtRQUFBLENBQUM7S0FDTDtJQUFDLFdBQU0sR0FBRTtJQUFBLENBQUM7QUFDZixDQUFDLENBQUMsQ0FBQyJ9