import "./bug";

import "./log";

//import "./give";
//Mojang Patched Fake InventoryTransAction packets themselves
import { CIFconfig } from "../configManager";
import { CIF } from "../main";

if (CIFconfig.Modules.combat) {
    require("./combat");
    CIF.log("Successfully Loaded Combat Modules".green);
};

if (CIFconfig.Modules.crasher) {
    require("./crasher");
    CIF.log("Successfully Loaded Crasher Modules".green);
};

if (CIFconfig.Modules.instabreak) {
    require("./instabreak");
    CIF.log("Successfully Loaded Instabreak Modules".green);
};

if (CIFconfig.Modules.join) {
    require("./join");
    CIF.log("Successfully Loaded Join Modules".green);
};

if (CIFconfig.Modules.movement) {
    require("./movement");
    CIF.log("Successfully Loaded Movement Modules".green);
};

if (CIFconfig.Modules.scaffold) {
    require("./scaffold");
    CIF.log("Successfully Loaded Scaffold Modules".green);
};

if (CIFconfig.Modules.xp) {
    require("./xp");
    CIF.log("Successfully Loaded XP Modules".green);
};