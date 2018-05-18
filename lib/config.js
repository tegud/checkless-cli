const { readFile, writeFile } = require("fs");
const util = require("util");
const yaml = require("js-yaml");

const readFilePromise = util.promisify(readFile);
const writeFilePromise = util.promisify(writeFile);

module.exports = {
    loadConfig: async (file) => {
        const fileContents = await readFilePromise(file, "utf-8");

        return yaml.safeLoad(fileContents);
    },
    writeConfig: async (config, outputFile) => writeFilePromise(outputFile, yaml.safeDump(config, { skipInvalid: true }), "utf-8"),
};
