import * as fs from "fs";
import { CIF } from "./main";

export namespace CIFconfig {
    export const Modules: ConfigType = {
        Debug: false,
        bug: true,
        combat: true,
        crasher: true,
        give: true,
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


function createNewFile(): void {
    fs.writeFileSync("../plugins/CIF/options.txt",
        `Debug = false
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
    "bug": boolean
    "combat": boolean
    "crasher": boolean
    "give": boolean
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
    for (; ;) {
        const matched = matcher.exec(options);
        if (matched === null) break;
        config[matched[1] as keyof IConfiguration] = stringToBoolean(matched[2]);
    }
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