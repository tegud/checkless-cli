const { loadConfig, writeConfig } = require("./lib/config");
const { expandToServerlessConfig } = require("./lib/serverless");

const signale = require("signale");
const program = require("commander");
const { stat, mkdir, readdir } = require("fs");
const { copy } = require("fs-extra");
const { promisify } = require("util");
const { spawn } = require("child_process");
const { estimate } = require("serverless-cost-estimate");

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
        .version("1.0.0")
        .description("Configures checkless to the configured AWS environment");

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
        .action(async () => {
            const config = await loadConfig(`${process.cwd()}/checkless.yml`);
            const serverlessConfig = expandToServerlessConfig(config);

            const functions = Object.keys(serverlessConfig)
                .reduce((allFunctions, region) => [
                    ...allFunctions,
                    ...Object.keys(serverlessConfig[region].functions)
                        .reduce((allRegionFunctions, functionName) => [
                            ...allRegionFunctions,
                            {
                                functionName,
                                region,
                                ...serverlessConfig[region].functions[functionName],
                            },
                        ], []),
                ], []);

            const functionBillingDurationCalculators = {
                "make-request": () => 1000,
                "handle-request": () => 100,
                "send-to-slack": () => 300,
            };

            const billableFunctions = functions.map(fn => ({
                region: fn.region,
                name: fn.functionName,
                handler: fn.handler,
                memory: fn.memory || 1024,
                executionTime: functionBillingDurationCalculators[fn.functionName](),
                events: fn.events.reduce((allEvents, current) => [
                    ...allEvents,
                    {
                        type: Object.keys(current)[0],
                        ...(typeof current[Object.keys(current)[0]] === "object"
                            ? { rate: current[Object.keys(current)[0]].rate }
                            : { target: current[Object.keys(current)[0]] }
                        ),
                    },
                ], []),
            }));

            const getExecutionsPerMonth = (rate) => {
                const timeComponentMatch = /rate\(([0-9]+) ([^)]+)\)/.exec(rate);

                if (timeComponentMatch[2].startsWith("minute")) {
                    return (60 * 24 * 30) / parseInt(timeComponentMatch[1], 10);
                }

                if (timeComponentMatch[2].startsWith("second")) {
                    return (60 * 60 * 24 * 30) / parseInt(timeComponentMatch[1], 10);
                }

                return 0;
            };

            const checkFunctions = billableFunctions.reduce((allCheckFunctions, current) => {
                if (current.name !== "make-request") {
                    return allCheckFunctions;
                }

                return [...allCheckFunctions, {
                    name: `${current.region}-make-request-${current.memory}mb`,
                    executionTime: current.executionTime,
                    memory: current.memory,
                    executions: current.events.reduce((totalExecutions, currentEvent) =>
                        totalExecutions + getExecutionsPerMonth(currentEvent.rate), 0),
                }];
            }, []);

            const estimatedCost = estimate({ provider: "aws", functions: checkFunctions, freeTier: false });

            if (estimatedCost.total === 0) {
                signale.success("Good News! The configured checks fit within the Free Tier");
                return;
            }

            Object.keys(estimatedCost.functionCosts).forEach(fnName => signale.info(`${fnName}: ${estimatedCost.currency}${estimatedCost.functionCosts[fnName].toFixed(2)}`));
            signale.success(`Total cost of checks: ${estimatedCost.currency}${estimatedCost.total} per month`);
        });

    program.parse(process.argv);
};
