import "./log";

import { CIF } from "../../main";

require("./combat");
CIF.log(`Successfully Loaded ${"Combat".magenta} Modules`.green);

require("./crasher");
CIF.log(`Successfully Loaded ${"Crasher".magenta} Modules`.green);

require("./give");
CIF.log(`Successfully Loaded ${"Give".magenta} Modules`.green);

require("./instabreak");
CIF.log(`Successfully Loaded ${"Instabreak".magenta} Modules`.green);

require("./join");
CIF.log(`Successfully Loaded ${"Join".magenta} Modules`.green);

require("./movement");
CIF.log(`Successfully Loaded ${"Movement".magenta} Modules`.green);

require("./scaffold");
CIF.log(`Successfully Loaded ${"Scaffold".magenta} Modules`.green);

require("./xp");
CIF.log(`Successfully Loaded ${"XP".magenta} Module`.green);

require("../util/CrashLogger");
CIF.log(`Successfully Loaded ${"CrashLogger".magenta} Module`.green);