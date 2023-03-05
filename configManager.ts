import * as fs from "fs";

export namespace CIFconfig {
    export const Modules: ConfigType = {
        Debug: false,
        combat: true,
        crasher: true,
        instabreak: true,
        join: true,
        log: true,
        movement: true,
        scaffold: true,
        xp: true
    };

    export const Penalties: ConfigType = {
        ban: true,
        kick: true,
        send_to_member: true
    };
};
import { CIF } from "./main";

function createNewFile(): void {
    fs.writeFileSync("../plugins/CIF/options.txt",
        `Debug = false
<<<<<<< HEAD
bug = true
combat = true
crasher = true
give = true
instabreak = true
join = true
log = true
movement = true
scaffold = true
xp = true
ban = true
kick = true
send_to_member = true`
=======
    combat = true
    crasher = true
    instabreak = true
    join = true
    log = true
    movement = true
    scaffold = true
    xp = true
    ban = true
    kick = true
    send_to_member = true`
>>>>>>> 18d3adcac083b85a03b4abea1768a54431ff37af
    );

    CIF.log("Generated new config file");
};

if (!fs.existsSync("./options.txt")) {
    createNewFile();
};


function stringToBoolean(str: string): boolean {
    if (str === "true") return true;
    else return false;
};


interface IConfiguration {
    "Debug": boolean
    "combat": boolean
    "crasher": boolean
    "instabreak": boolean
    "join": boolean
    "log": boolean
    "movement": boolean
    "scaffold": boolean
    "xp": boolean
    "ban": boolean
    "kick": boolean
    "send_to_member": boolean
};

type ConfigType = { [key in keyof IConfiguration]?: boolean };

const config: ConfigType = {};

try {
    const optionFile = "../plugins/CIF/options.txt";
    const options = fs.readFileSync(optionFile, "utf8");
    const matcher = /^\s*([^=#]+)\s*=\s*(.*)\s*$/gm;
    while (true) {
        const matched = matcher.exec(options);
        if (matched === null) break;
        config[matched[1] as keyof IConfiguration] = stringToBoolean(matched[2]);
    };
} catch (err) {
    throw err;
};

for (const [key, value] of Object.entries(config)) {
    if (key === "ban" || key === "kick" || key === "send_to_member") {
        CIFconfig.Penalties[key] = value;
    } else {
        CIFconfig.Modules[key as keyof IConfiguration] = value;
    };
};



if (CIFconfig.Modules.Debug === true) {
    require("./debug/debug");
};

import "./scripts";