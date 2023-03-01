import { existsSync } from "fs";

export namespace configManager {
    export namespace configs {
        export namespace modules {
            
        };
    };

    export function createNewFile(): void {
        const options: any = {};
        options.module = {};
    };

};

export default configManager






if (!existsSync("./options.txt")) {
    configManager.createNewFile();
};
