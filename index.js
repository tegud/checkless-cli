const { loadConfig, writeConfig } = require("./lib/config");
const { expandToServerlessConfig } = require("./lib/serverless");

const signale = require("signale");
const program = require("commander");

module.exports = () => {
    program
        .version("1.0.0")
        .description("Configures checkless to the configured AWS environment");

    program
        .command("generate [file] [outputFile]")
        .description("Generates serverless config for the checkless config")
        .action(async (file = "checkless.yml", outputFile = "serverless.yml") => {
            signale.info(`Loading config from ${file}`);

            const config = await loadConfig(`${process.cwd()}/${file}`);
            const serverlessConfig = expandToServerlessConfig(config);

            await writeConfig(serverlessConfig, `${process.cwd()}/${outputFile}`);

            signale.success(`Serverless config written to: ${outputFile}`);
        });

    program.parse(process.argv);
};
