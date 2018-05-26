const { loadConfig, writeConfig } = require("./lib/config");
const { expandToServerlessConfig } = require("./lib/serverless-config");
const { estimate } = require("./lib/estimate-cost");
const { version } = require("./package.json");

const signale = require("signale");
const program = require("commander");
const { stat, mkdir, readdir } = require("fs");
const { copy } = require("fs-extra");
const { promisify } = require("util");
const { spawn } = require("child_process");

const promiseStat = promisify(stat);
const promiseMkDir = promisify(mkdir);
const promiseReadDir = promisify(readdir);

const createFolderIfNeeded = async (directory) => {
    try {
        return await promiseStat(directory);
    } catch (error) {
        // Do nothing
    }

    signale.info(`Creating directory: ${directory}`);
    return promiseMkDir(directory);
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

const getRegionFolders = async () => promiseReadDir(`${process.cwd()}/.checkless`);

const execServerless = async region => new Promise((resolve, reject) => {
    const serverless = spawn("serverless", [
        "deploy",
    ], {
        cwd: `${process.cwd()}/.checkless/${region}`,
    });

    serverless.stdout.on("data", (data) => {
        console.log(data.toString("utf-8"));
    });

    serverless.stderr.on("data", (data) => {
        console.error(data.toString("utf-8"));
    });

    serverless.on("error", (data) => {
        console.error(data.toString("utf-8"));
    });

    serverless.on("close", (code) => {
        if (code) {
            reject(new Error(`Serverless exited with code: ${code}`));
            return;
        }

        resolve();
    });
});

module.exports = () => {
    program
        .version(version)
        .description("Manages Checkless within the configured AWS environment");

    program
        .command("generate [file]")
        .description("Generates serverless config for the checkless config")
        .action(async (file = "checkless.yml") => {
            signale.info(`Loading config from ${file}`);

            const outputFile = "serverless.yml";
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

    program
        .command("deploy [region]")
        .description("Generates serverless config for the checkless config")
        .action(async (region) => {
            const regionFolders = await getRegionFolders();

            const regions = regionFolders.filter(folder => !region || folder === region);

            signale.info(`Deploying checkless to ${regions.join(", ")} region${regions.length === 1 ? "" : "s"}`);

            const remainingDeploys = [...regions];
            while (remainingDeploys.length) {
                const deploy = remainingDeploys.shift();

                signale.info(`Deploying checkless to ${deploy}`);

                try {
                    await execServerless(deploy); // eslint-disable-line no-await-in-loop
                } catch (error) {
                    signale.error(error.message);
                    return;
                }
            }

            signale.success(`Checkless deployed to ${regions.length} region${regions.length === 1 ? "" : "s"}`);
        });

    program
        .command("estimate")
        .description("Estimate costs for checkless config")
        .option("--ignore-free-tier", "Ignore the free tier")
        .action(async (options) => {
            const config = await loadConfig(`${process.cwd()}/checkless.yml`);
            const serverlessConfig = expandToServerlessConfig(config);

            const freeTier = !options.ignoreFreeTier;

            const estimatedCost = estimate({ serverlessConfig, freeTier });

            if (estimatedCost.total === 0) {
                signale.success("Good News! The configured checks fit within the Free Tier");
                return;
            }

            Object.keys(estimatedCost.functionCosts).forEach((fnName) => {
                const [region, name, memory] = fnName.split("|");

                signale.info(`${region}, ${name} (${memory}): ${estimatedCost.currency}${estimatedCost.functionCosts[fnName].toFixed(2)}`);
            });

            signale.success(`Total cost of checks: ${estimatedCost.currency}${estimatedCost.total} per month`);
        });

    program.parse(process.argv);
};
