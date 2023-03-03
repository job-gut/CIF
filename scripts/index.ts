import "./bug";

import "./log";

//import "./give";
//Mojang Patched Fake InventoryTransAction packets themselves
import { CIFconfig } from "../configManager";
import { CIF } from "../main";

if (CIFconfig.Modules.combat) {
    require("./combat");
    CIF.log("§cSuccessfully Loaded Combat Modules".green);
};

if (CIFconfig.Modules.crasher) {
    require("./crasher");
    CIF.log("§cSuccessfully Loaded Crasher Modules".green);
};

if (CIFconfig.Modules.instabreak) {
    require("./instabreak");
    CIF.log("§cSuccessfully Loaded Instabreak Modules".green);
};

if (CIFconfig.Modules.join) {
    require("./join");
    CIF.log("§cSuccessfully Loaded Join Modules".green);
};

if (CIFconfig.Modules.movement) {
    require("./movement");
    CIF.log("§cSuccessfully Loaded Movement Modules".green);
};

if (CIFconfig.Modules.scaffold) {
    require("./scaffold");
    CIF.log("§cSuccessfully Loaded Scaffold Modules".green);
};

if (CIFconfig.Modules.xp) {
    require("./xp");
    CIF.log("§cSuccessfully Loaded XP Modules".green);
};