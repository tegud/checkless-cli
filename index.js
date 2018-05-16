const { loadConfig } = require("./lib/config-loader");
const { expandToServerlessConfig } = require("./lib/serverless");

const writeServerlessConfig = async () => {};

const program = require("commander");

program
    .version("1.0.0")
    .description("Configures checkless to the configured AWS environment");

program
    .command("generate [file]")
    .description("Generates serverless config for the checkless config")
    .action(async (file = "checkless.yml", outputFile = "serverless.yml") => {
        console.log(`Loading config from ${file}`);

        const config = await loadConfig(`${process.cwd()}/${file}`);

        console.log(JSON.stringify(config, null, 4));

        const serverlessConfig = expandToServerlessConfig(config);

        await writeServerlessConfig(serverlessConfig, outputFile);

        console.log(`Serverless config written to: ${outputFile}`);
    });

program.parse(process.argv);
