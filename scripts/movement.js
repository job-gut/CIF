"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const packetids_1 = require("bdsx/bds/packetids");
const event_1 = require("bdsx/event");
const lastpos = {};
const strafestack = {};
const lastbps = {};
const getDamaged = {};
const isSpinAttacking = {};
const isTeleported = {};
const haveFished = {};
const onIce = {};
event_1.events.packetBefore(packetids_1.MinecraftPacketIds.MovePlayer).on((pkt, ni) => {
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb3ZlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGtEQUF3RDtBQUV4RCxzQ0FBb0M7QUFFcEMsTUFBTSxPQUFPLEdBQTZCLEVBQUUsQ0FBQztBQUM3QyxNQUFNLFdBQVcsR0FBMkIsRUFBRSxDQUFDO0FBQy9DLE1BQU0sT0FBTyxHQUEyQixFQUFFLENBQUM7QUFDM0MsTUFBTSxVQUFVLEdBQTRCLEVBQUUsQ0FBQztBQUMvQyxNQUFNLGVBQWUsR0FBNEIsRUFBRSxDQUFDO0FBQ3BELE1BQU0sWUFBWSxHQUE0QixFQUFFLENBQUM7QUFDakQsTUFBTSxVQUFVLEdBQTRCLEVBQUUsQ0FBQztBQUMvQyxNQUFNLEtBQUssR0FBNEIsRUFBRSxDQUFDO0FBUTFDLGNBQU0sQ0FBQyxZQUFZLENBQUMsOEJBQWtCLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFO0FBRWxFLENBQUMsQ0FBQyxDQUFDIn0=