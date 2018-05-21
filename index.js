const { loadConfig, writeConfig } = require("./lib/config");
const { expandToServerlessConfig } = require("./lib/serverless");

const signale = require("signale");
const program = require("commander");
const { stat, mkdir } = require("fs");
const { copy } = require("fs-extra");
const { promisify } = require("util");

const promiseStat = promisify(stat);
const mkDirStat = promisify(mkdir);

const createFolderIfNeeded = async (directory) => {
    try {
        return await promiseStat(directory);
    } catch (error) {
        // Do nothing
    }

    signale.info(`Creating directory: ${directory}`);
    return mkDirStat(directory);
};

const copyNodeModulesToRegionDirectory = async (directory) => {
    signale.info(`Copying node_modules to: ${directory}`);

    return copy(`${process.cwd()}/node_modules`, `${directory}/node_modules`);
};

const createServerlessDeploy = async (region, outputFile, config) => {
    const rootDirectory = `${process.cwd()}/.checkless`;
    const directory = `${rootDirectory}/${region}`;

    await createFolderIfNeeded(directory);

    await copyNodeModulesToRegionDirectory(directory);

    await writeConfig(config, `${directory}/${outputFile}`);
};

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

            signale.info(`Loaded config from ${file}`);

            const serverlessConfig = expandToServerlessConfig(config);

            const regionConfigs = Object.keys(serverlessConfig);

            signale.info(`Regions to install to: ${regionConfigs.join(", ")}`);

            try {
                await createFolderIfNeeded(`${process.cwd()}/.checkless`);

                await Promise.all(regionConfigs.map(region => createServerlessDeploy(
                    region,
                    outputFile,
                    serverlessConfig[region],
                )));
            } catch (error) {
                signale.error("Error writing serverless config", error);
                return;
            }

            signale.success("Serverless configs written");
        });

    program.parse(process.argv);
};
