import "./log";

import { CIFconfig } from "../util/configManager";
import { CIF } from "../../main";

if (CIFconfig.Modules.combat === true) {
    require("./combat");
    CIF.log(`Successfully Loaded ${"Combat".magenta} Modules`.green);
};

if (CIFconfig.Modules.crasher === true) {
    require("./crasher");
    CIF.log(`Successfully Loaded ${"Crasher".magenta} Modules`.green);
};

require("./give");
CIF.log(`Successfully Loaded ${"Give".magenta} Modules`.green);

if (CIFconfig.Modules.instabreak === true) {
    require("./instabreak");
    CIF.log(`Successfully Loaded ${"Instabreak".magenta} Modules`.green);
};

if (CIFconfig.Modules.join === true) {
    require("./join");
    CIF.log(`Successfully Loaded ${"Join".magenta} Modules`.green);
};

if (CIFconfig.Modules.movement === true) {
    require("./movement");
    CIF.log(`Successfully Loaded ${"Movement".magenta} Modules`.green);
};

if (CIFconfig.Modules.scaffold === true) {
    require("./scaffold");
    CIF.log(`Successfully Loaded ${"Scaffold".magenta} Modules`.green);
};

if (CIFconfig.Modules.xp === true) {
    require("./xp");
    CIF.log(`Successfully Loaded ${"XP".magenta} Module`.green);
};

if (CIFconfig.Modules.Debug === true) {
	require("../util/CrashLogger");
	CIF.log(`Successfully Loaded ${"CrashLogger".magenta} Module`.green);
};