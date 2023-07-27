export let CIFVersion = "23v7.27.1803";


import * as fs from "fs";
import * as http from "http";
import { exec } from "child_process";

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
auto_update = false
`
	);
};

if (!fs.existsSync("../CIFoptions.txt")) {
	createNewFile();
};

export function getWhatsNew(): string {
	let rawdata = "";

	try {
		http.get("http://cifupdate.kro.kr/398znmfl-rf-zrekip029z-qwerwe/zmofip=43-8900ua34j3-09-124825425234-z9i90j/version.txt", (res)=> {
			if (res.statusCode !== 200) return;
			res.setEncoding('utf8');            
			res.on('data', (buffer) => rawdata += buffer);
            res.on('end', function () {
                if (!rawdata.includes("v")) return;
				return rawdata.split(":")[1]
            });
		});
	} catch {
		return rawdata;
	};

	return rawdata;
};

export function getNewVersion(): string {
	let rawdata = "";

	try {
		http.get("http://cifupdate.kro.kr/398znmfl-rf-zrekip029z-qwerwe/zmofip=43-8900ua34j3-09-124825425234-z9i90j/version.txt", (res)=> {
			if (res.statusCode !== 200) return;
			res.setEncoding('utf8');            
			res.on('data', (buffer) => rawdata += buffer);
            res.on('end', function () {
                if (!rawdata.includes("v")) return;
				return rawdata.split(":")[0];
            });
		});
	} catch {
		return rawdata;
	};

	return rawdata;
};

export function thisACisLastestVersion(): boolean | undefined {
	let rawdata = "";

	try {
		http.get("http://cifupdate.kro.kr/398znmfl-rf-zrekip029z-qwerwe/zmofip=43-8900ua34j3-09-124825425234-z9i90j/version.txt", (res)=> {
			if (res.statusCode !== 200) return;
			res.setEncoding('utf8');            
			res.on('data', (buffer) => rawdata += buffer);
            res.on('end', function () {
                if (!rawdata.includes("v")) return;
				return rawdata.split(":")[0] === CIFVersion;
            });
		});
	} catch {
		return;
	};

	return false;
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

export function update(isNotFirstCall: boolean | undefined = undefined): void {
	if (thisACisLastestVersion() === undefined) {
		console.warn("CIF 메인 서버에 연결 할 수 없습니다".red);
		import("./modules/util/configManager");
		import("./main");
		return;
	};

	if (thisACisLastestVersion() === true) {
		import("./modules/util/configManager");
		import("./main");
		return;
	};


	if(download("http://cifupdate.kro.kr/398znmfl-rf-zrekip029z-qwerwe/zmofip=43-8900ua34j3-09-124825425234-z9i90j/CIF.zip", "../plugins/CIF.zip") !== true) {
		import("./modules/util/configManager");
		import("./main");
		return;
	};

	exec('cmd /c rmdir /q /s "../plugins/cif"', ((err, stdout, stderr) => {
		if (err) throw err;
	}));

	setTimeout(() => {
		exec("powershell Expand-Archive -Force -path '../plugins/CIF.zip' -Destinationpath '../plugins/CIF'", ((err, stdout, stderr) => {
			if (err) throw err;
			if (isNotFirstCall === true)  {
				const { CIF } = require("./main");
				CIF.log(`CIF 가 성공적으로 업데이트 되었습니다`.green);
				CIF.log(`업데이트 사항: `+getWhatsNew().yellow);
				CIFVersion = getNewVersion();
				return; 
			};

			import("./modules/util/configManager");
			import("./main").then(()=> {
				const { CIF } = require("./main");
				CIF.log(`CIF 가 성공적으로 업데이트 되었습니다`.green);
				CIF.log(`업데이트 사항: `+getWhatsNew().yellow);
				CIFVersion = getNewVersion();
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