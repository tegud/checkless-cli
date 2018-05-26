const { loadConfig, writeConfig } = require("./lib/config");
const { expandToServerlessConfig } = require("./lib/serverless-config");
const { execServerless } = require("./lib/serverless-deploy");
const { estimate } = require("./lib/estimate-cost");
const { listRegions } = require("./lib/aws-region-list");
const { version } = require("./package.json");

const signale = require("signale");
const inquirer = require("inquirer");
const program = require("commander");
const { stat, mkdir, readdir } = require("fs");
const { copy } = require("fs-extra");
const { promisify } = require("util");

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
        .command("init")
        .description("Initialise Checkless Project")
        .action(async () => {
            // const checklessConfigExists = await checklessConfigExists(`${process.cwd}/checkless.yml`);

            const options = await inquirer.prompt([
                {
                    type: "input",
                    name: "name",
                    message: "Name of the checkless installation",
                    default: "checkless",
                },
                {
                    type: "list",
                    name: "region",
                    message: "Home Region (where the main functions are installed)",
                    choices: listRegions().map(region => ({ name: region, value: region })),
                    default: "Europe - Ireland (eu-west-1)",
                },
            ]);

            console.log(options);

            let configDone = false;
            const checks = [];

            while (!configDone) {
                const { choice } = await inquirer.prompt([ // eslint-disable-line no-await-in-loop
                    {
                        type: "list",
                        name: "choice",
                        message: "Would you like to add a new check, notification or finish?",
                        choices: [
                            { name: "Add Check", value: "check" },
                            { name: "Add Notification", value: "notification" },
                            { name: "Done", value: "done" },
                        ],
                        default: "Europe - Ireland (eu-west-1)",
                    },
                ]);

                if (choice === "done") {
                    configDone = true;
                    break;
                }

                if (choice === "check") {
                    const newCheck = await inquirer.prompt([ // eslint-disable-line no-await-in-loop
                        {
                            type: "input",
                            name: "name",
                            message: "Name of the check",
                            validate: value => (value ? true : "Please enter a check name"),
                        },
                        {
                            type: "input",
                            name: "url",
                            message: "URL of the check",
                            validate: (value) => {
                                if (value) {
                                    return true;
                                }

                                return "Please enter a URL";
                            },
                        },
                        {
                            type: "list",
                            name: "checkEvery",
                            message: "Check Frequency",
                            choices: [
                                "30 seconds",
                                "1 minute",
                                "90 seconds",
                                "5 minute",
                                "10 minute",
                            ].map(option => ({
                                key: option,
                                value: option,
                            })),
                            default: "5 minute",
                        },
                        {
                            type: "checkbox",
                            name: "region",
                            message: "Select regions to check from",
                            choices: listRegions().map(region => ({ name: region, value: region })),
                            default: "Europe - Ireland (eu-west-1)",
                            validate: (value) => {
                                if (!value.length) {
                                    return "Please select at least one region";
                                }

                                return true;
                            },
                        },
                    ]);

                    checks.push(newCheck);
                }

                if (choice === "notification") {
                    signale.info("Add new notification");
                }
            }

            console.log({
                ...options,
                checks,
            });

            const confirmation = await inquirer.prompt([
                {
                    type: "bool",
                    name: "confirm",
                    message: "Is that correct?",
                    default: "true",
                },
            ]);

            if (!confirmation) {
                return;
            }

            signale.success("checkless.yml written!");
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
