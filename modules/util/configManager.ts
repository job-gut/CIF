import { Config } from "bdsx/config";
import { serverProperties } from "bdsx/serverproperties";
import * as path from "path";
import * as fs from "fs";

//  ██████ ██ ███████      ██████  ██████  ███    ██ ███████ ██  ██████
// ██      ██ ██          ██      ██    ██ ████   ██ ██      ██ ██
// ██      ██ █████       ██      ██    ██ ██ ██  ██ █████   ██ ██   ███
// ██      ██ ██          ██      ██    ██ ██  ██ ██ ██      ██ ██    ██
//  ██████ ██ ██           ██████  ██████  ██   ████ ██      ██  ██████

export namespace CIFconfig {
	export const Modules: ConfigType = {
		Debug: false,
		combat: true,
		crasher: true,
		instabreak: true,
		join: true,
		movement: true,
		scaffold: true,
		xp: true,
		auto_update: true,
		log_packets: false,
	};
	export const Penalties: ConfigType = {
		ban: true,
		kick: true,
		send_to_member: true
	};
};

export namespace CIFconfigNames {
	export const combat = "combat";
	export const crasher = "crasher";
	export const instabreak = "instabreak";
	export const join = "join";
	export const movement = "movement";
	export const scaffold = "scaffold";
	export const xp = "xp";
	export const log_packets = "log_packets";
};

import { CIF } from "../../main";

function createNewFile(): void {
	fs.writeFileSync("../CIFoptions.txt",
		`Debug = false
bug = true
combat = true
crasher = true
give = true
instabreak = true
join = true
movement = true
scaffold = true
xp = true
ban = true
kick = true
send_to_member = true
auto_update = true
`
	);
	CIF.log("Generated new config file");
};

if (!fs.existsSync("../CIFoptions.txt")) {
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
	"movement": boolean
	"scaffold": boolean
	"xp": boolean
	"ban": boolean
	"kick": boolean
	"send_to_member": boolean
	"auto_update": boolean,
	"log_packets": boolean,
};

type ConfigType = { [key in keyof IConfiguration]?: boolean };

const config: ConfigType = {};

try {
	const optionFile = "../CIFoptions.txt";
	const options = fs.readFileSync(optionFile, "utf8");
	const matcher = /^\s*([^=#]+)\s*=\s*(.*)\s*$/gm;
	while (true) {
		const matched = matcher.exec(options);
		if (matched === null) break;
		config[matched[1].trim() as keyof IConfiguration] = stringToBoolean(matched[2]);
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

// ███████ ███████ ██████  ██    ██ ███████ ██████      ██████  ██████   ██████  ██████  ███████ ██████  ████████ ██ ███████ ███████
// ██      ██      ██   ██ ██    ██ ██      ██   ██     ██   ██ ██   ██ ██    ██ ██   ██ ██      ██   ██    ██    ██ ██      ██
// ███████ █████   ██████  ██    ██ █████   ██████      ██████  ██████  ██    ██ ██████  █████   ██████     ██    ██ █████   ███████
//      ██ ██      ██   ██  ██  ██  ██      ██   ██     ██      ██   ██ ██    ██ ██      ██      ██   ██    ██    ██ ██           ██
// ███████ ███████ ██   ██   ████   ███████ ██   ██     ██      ██   ██  ██████  ██      ███████ ██   ██    ██    ██ ███████ ███████
if (serverProperties["server-authoritative-movement"] !== "client-auth") {
	const propertyPath = Config.BDS_PATH + path.sep + "server.properties";
	let properties = fs.readFileSync(propertyPath, "utf8");
	const matcher = /^\s*([^=#]+)\s*=\s*(.*)\s*$/gm;


	let hasbeenChanged = false;

	while (true) {
		const matched = matcher.exec(properties);
		if (matched === null) break;
		const matchedIndex = properties.indexOf(`${matched[1]}=`);

		const targetProperties: { [keyof: string]: string } = {
			"player-movement-score-threshold": "0",
			"player-movement-action-direction-threshold": "1",
			"player-movement-distance-threshold": "0",
			"player-movement-duration-threshold-in-ms": "0",
			"correct-player-movement": "false",
			"server-authoritative-block-breaking": "false",
			"emit-server-telemetry": "true"
		};

		for (const [targetKey, targetValue] of Object.entries(targetProperties)) {
			if (matched[1] === targetKey && matched[2] !== targetValue) {
				properties = properties.replace(properties.substring(matchedIndex, matchedIndex + matched[1].length + matched[2].length + 1), `${targetKey}=${targetValue}`);
				CIF.log(`${"Serverproperties".magenta} : Value of ${matched[1].cyan} changed from ${matched[2].green} to ${targetValue.green}`);
				hasbeenChanged = true;
				break;
			};
		};
	};

	if (hasbeenChanged) {
		fs.writeFileSync(propertyPath, properties);

		CIF.log('ServerProperties Saved'.cyan);
		CIF.log('Please restart the server.'.red);
		setTimeout(() => {
			process.exit(1);
		}, 2000);
	};
};

import "./implements";
import "../scripts";

if (CIFconfig.Modules.Debug === true) {
	require("../../debug/debug");
	console.log("********** CIF DEBUG MODE HAS BEEN ENABLED **********".red);
};