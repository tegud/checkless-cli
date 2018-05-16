const yaml = require("js-yaml");
const util = require("util");
const readFile = util.promisify(require("fs").readFile);

module.exports = {
    loadConfig: async (file) => {
        const fileContents = await readFile(file, "utf-8");

        return yaml.safeLoad(fileContents);
    },
};
