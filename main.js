"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CIF = void 0;
const common_1 = require("bdsx/common");
const launcher_1 = require("bdsx/launcher");
const serverproperties_1 = require("bdsx/serverproperties");
if (serverproperties_1.serverProperties["server-authoritative-movement"] !== "client-auth") {
    throw new Error("CIF는 client-auth 를 필요로 합니다.");
}
;
/**
 * @deprecated 다른 곳에서 임의로 쓰지 마세요
 */
function zero(num, n) {
    let zero = "";
    let num2 = num.toString();
    if (num2.length < n) {
        for (var i = 0; i < n - num2.length; i++)
            zero += "0";
    }
    return zero + num;
}
;
/**
 * Date With Zero
 */
function dateWithZero() {
    var d = new Date();
    return (d.getFullYear() + "-" + zero((d.getMonth() + 1), 2) + "-"
        + zero(d.getDate(), 2) + ", " + zero(d.getHours(), 2) + "시 "
        + zero(d.getMinutes(), 2) + "분 " + zero(d.getSeconds(), 2) + "초 " + zero(d.getMilliseconds(), 3));
}
var CIF;
(function (CIF) {
    /**
    * 콘솔에 로그를 남깁니다
    * @param message 콘솔에 남길 문자
    */
    function Log(message) {
        const date = new Date();
        console.info("[" + date.getFullYear() + "-" + zero((date.getMonth() + 1), 2) + "-" + zero(date.getDate(), 2) + " " + zero(date.getHours(), 2) + ":" + zero(date.getMinutes(), 2) + ":" + zero(date.getSeconds(), 2) + ":" + zero(date.getMilliseconds(), 3) + " INFO] " + " [CIF] ".red + message);
    }
    CIF.Log = Log;
    ;
    /**
     * 대충 밴 함수
     * @description 현재 밴 기능 수행 X
     */
    function ban(ni, reason) {
        const cheaterName = join_1.nameMap.get(ni);
        const users = launcher_1.bedrockServer.serverInstance.getPlayers().filter(p => p.getCommandPermissionLevel() === 0);
        for (const member of users) {
            member.sendMessage(`§6[CIF] §c${cheaterName} §6was banned using §c${reason}`);
        }
    }
    CIF.ban = ban;
    /**
     * 대충 핵 감지됐을 때 쓰는 함수
     * @description CIF.ban() 은 이 함수에서 호출 안 함
     */
    function detect(ni, cheatName, CheatDescription) {
        const cheaterName = join_1.nameMap.get(ni);
        launcher_1.bedrockServer.serverInstance.disconnectClient(ni, `§l§f[§cCIF§f]\n§e${cheatName} Detected`);
        const operators = launcher_1.bedrockServer.serverInstance.getPlayers().filter(p => p.getCommandPermissionLevel() === 1);
        for (const gm of operators) {
            gm.sendMessage(`§c[CIF] ${cheaterName} was banned using ${cheatName}(${CheatDescription})`);
        }
        return common_1.CANCEL;
    }
    CIF.detect = detect;
    ;
})(CIF = exports.CIF || (exports.CIF = {}));
;
require("./scripts");
const join_1 = require("./scripts/join");
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0Esd0NBQXFDO0FBQ3JDLDRDQUE4QztBQUM5Qyw0REFBeUQ7QUFJekQsSUFBSSxtQ0FBZ0IsQ0FBQywrQkFBK0IsQ0FBQyxLQUFLLGFBQWEsRUFBRTtJQUNyRSxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7Q0FDbEQ7QUFBQSxDQUFDO0FBRUY7O0dBRUc7QUFDSCxTQUFTLElBQUksQ0FBQyxHQUFRLEVBQUUsQ0FBTTtJQUMxQixJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7SUFDZCxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDMUIsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUNqQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFO1lBQ3BDLElBQUksSUFBSSxHQUFHLENBQUM7S0FDbkI7SUFDRCxPQUFPLElBQUksR0FBRyxHQUFHLENBQUM7QUFDdEIsQ0FBQztBQUFBLENBQUM7QUFHRjs7R0FFRztBQUNILFNBQVMsWUFBWTtJQUNqQixJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQ25CLE9BQU8sQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHO1VBQzNELElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSTtVQUMxRCxJQUFJLENB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