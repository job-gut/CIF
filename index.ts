export let CIFVersion = "23v1.3.1953";


import * as fs from "fs";
import * as http from "http";
import { exec } from "child_process";


process.on("uncaughtException", ((err)=> {
	console.warn("Couldn't connect to CIF main server".red);
}));



function createNewFile(): void {
	fs.writeFileSync("../CIFoptions.txt",
		`Debug = false
combat = true
crasher = true
give = true
instabreak = true
join = true
movement = true
player = true
scaffold = true
xp = true
ban = true
kick = true
blockAllPackets = true
onlyAlert = true
auto_update = true
`
	);
};

if (!fs.existsSync("../CIFoptions.txt")) {
	createNewFile();
};


async function getRawData(): Promise<string> {
	let rawdata = "";
	return new Promise((resolve) => {
		http.get("http://cifupdate.kro.kr/398znmfl-rf-zrekip029z-qwerwe/zmofip=43-8900ua34j3-09-124825425234-z9i90j/version.txt", (res) => {
			if (res.statusCode !== 200) return;
			res.setEncoding('utf8');
			res.on('data', (buffer) => rawdata += buffer);
			res.on('end', function () {
				if (!rawdata.includes("v")) return;
				resolve(rawdata);
			});
		});
	});
};


export async function getWhatsNew(): Promise<string> {
	const data = await getRawData();
	return data.split(":")[1];
};

export async function getNewVersion(): Promise<string> {
	const data = await getRawData();
	return data.split(":")[0];
};

export async function thisACisLastestVersion(): Promise<boolean | undefined> {
	const data = await getRawData();
	return data.split(":")[0] === CIFVersion;
};

function download(url: string, path: string, cb: any = undefined): boolean {
	const file = fs.createWriteStream(path);
	try {
		const request = http.get(url, (response) => {
			if (response.statusCode !== 200) return false;
			response.pipe(file);
		});

		file.on('finish', () => file.close(cb));
		request.on('error', (err) => {
			fs.unlink(path, () => cb(err.message));
		});
		file.on('error', (err) => {
			fs.unlink(path, () => cb(err.message));
		});
	} catch {
		return false;
	};

	return true;
};

export async function update(isNotFirstCall: boolean | undefined = undefined): Promise<void> {
	if (await thisACisLastestVersion() === undefined && !isNotFirstCall) {
		console.warn("Couldn't connect to CIF main server".red);
		import("./modules/util/configManager");
		import("./main");
		return;
	};

	if (await thisACisLastestVersion() === true && !isNotFirstCall) {
		import("./modules/util/configManager");
		import("./main");
		return;
	};


	if (await download("http://cifupdate.kro.kr/398znmfl-rf-zrekip029z-qwerwe/zmofip=43-8900ua34j3-09-124825425234-z9i90j/CIF.zip", "../plugins/CIF.zip") !== true) {
		import("./modules/util/configManager");
		import("./main");
		return;
	};

	await exec('cmd /c rmdir /q /s "../plugins/cif"', ((err, stdout, stderr) => {
		if (err) throw err;
	}));

	await setTimeout(() => {
		exec("powershell Expand-Archive -Force -path '../plugins/CIF.zip' -Destinationpath '../plugins/CIF'", (async (err, stdout, stderr) => {
			if (err) throw err;
			const whatsNew = await getWhatsNew();
			if (isNotFirstCall === true) {
				const { CIF } = require("./main");
				CIF.log(`Updated CIF successfully!`.green);
				CIF.log(`Changes: ${whatsNew}`.yellow);
				CIF.log(`Changes will be applied after reboot`.magenta);
				CIF.announce(`§aUpdated CIF successfully!\n§eChanges: ${whatsNew}\n§dChanges will be applied after reboot`);
				CIFVersion = await getNewVersion();
				return;
			};

			import("./modules/util/configManager");
			import("./main").then(async () => {
				const { CIF } = require("./main");
				CIF.log(`Updated CIF successfully`.green);
				CIF.log(`Changes: ${whatsNew}`.yellow);
				CIFVersion = await getNewVersion();
			});
		}));
	}, 1000).unref();
};

function stringToBoolean(str: string): boolean {
	if (str.includes("true")) return true;
	else return false;
};
setTimeout(() => {

	const config: { [keyof: string]: boolean } = {};

	try {
		const optionFile = "../CIFoptions.txt";
		const options = fs.readFileSync(optionFile, "utf8");
		const matcher = /^\s*([^=#]+)\s*=\s*(.*)\s*$/gm;
		while (true) {
			const matched = matcher.exec(options);
			if (matched === null) break;
			config[matched[1].trim()] = stringToBoolean(matched[2]);
		};
	} catch (err) {
		throw err;
	};
	if (config["auto_update"]) {
		update();
	} else {
		console.warn("CIF auto update is disabled".yellow);
		import("./modules/util/configManager");
		import("./main");
	};
}, 1000);