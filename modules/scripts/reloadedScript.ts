import { events } from "bdsx/event";

let Reloaded = false;

/*
	주의 사항
 */

//이벤트 리스너 안의 맨 윗줄에 반드시
//if (Reloaded) return; 문구를 적을 것
//setTimeout, setInterval 같은 경우는 맨 아래 이벤트 리스너에 clearTimeout, clearInterval 을 추가할 것
//또한 뒤에 .unref() 를 붙여 프로세스가 뒤진 뒤에도 작동 되는것을 방지할 것

















events.packetBefore(77).on((pkt, ni) => {
    if (Reloaded) return;
    const pl = ni.getActor()!;
    if (pl.getCommandPermissionLevel() > 0)
        if (pkt.command === "/reload") {
            pl.sendMessage("§a리로드 완료!");
            Reloaded = true;
        }
    ;
});
throw "";