import "./log";

//import "./give";
//Mojang Patched Fake InventoryTransAction packets themselves
import { CIFconfig } from "../util/configManager";
import { CIF } from "../../main";

if (CIFconfig.Modules.combat) {
    require("./combat");
    CIF.log(`Successfully Loaded ${"Combat".magenta} Modules`.green);
};

if (CIFconfig.Modules.crasher) {
    require("./crasher");
    CIF.log(`Successfully Loaded ${"Crasher".magenta} Modules`.green);
};

if (CIFconfig.Modules.instabreak) {
    require("./instabreak");
    CIF.log(`Successfully Loaded ${"Instabreak".magenta} Modules`.green);
};

if (CIFconfig.Modules.join) {
    require("./join");
    CIF.log(`Successfully Loaded ${"Join".magenta} Modules`.green);
};

if (CIFconfig.Modules.movement) {
    require("./movement");
    CIF.log(`Successfully Loaded ${"Movement".magenta} Modules`.green);
};

if (CIFconfig.Modules.scaffold) {
    require("./scaffold");
    CIF.log(`Successfully Loaded ${"Scaffold".magenta} Modules`.green);
};

if (CIFconfig.Modules.xp) {
    require("./xp");
    CIF.log(`Successfully Loaded ${"XP".magenta} Modules`.green);
};