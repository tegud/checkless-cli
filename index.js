const fs = require("fs");
const yaml = require("js-yaml");

const { loadConfig } = require("./lib/config-loader");
const { expandToServerlessConfig } = require("./lib/serverless");

const writeServerlessConfig = async (config, outputFile) => new Promise((resolve, reject) => fs.writeFile(`${process.cwd()}/${outputFile}`, yaml.safeDump(config, { skipInvalid: true }), "utf-8", (err) => {
    if (err) {
        return reject(err);
    }

    return resolve();
}));

const program = require("commander");

program
    .version("1.0.0")
    .description("Configures checkless to the configured AWS environment");

program
    .command("generate [file] [outputFile]")
    .description("Generates serverless config for the checkless config")
    .action(async (file = "checkless.yml", outputFile = "serverless.yml") => {
        console.log(`Loading config from ${file}`);

        const config = await loadConfig(`${process.cwd()}/${file}`);
        const serverlessConfig = expandToServerlessConfig(config);

        await writeServerlessConfig(serverlessConfig, outputFile);

        console.log(`Serverless config written to: ${outputFile}`);
    });

program.parse(process.argv);
