const { basicInfo } = require("./basic-info");
const { newCheck } = require("./new-check");
const { newNotification } = require("./new-notification");

const inquirer = require("inquirer");
const yaml = require("js-yaml");

const donePrompt = async () => inquirer.prompt([
    {
        type: "list",
        name: "choice",
        message: "Would you like to add a new check, notification or finish?",
        choices: [
            { name: "Add Check", value: "check" },
            { name: "Add Notification", value: "notification" },
            { name: "Finish", value: "done" },
        ],
    },
]);

const confirmOk = async () => inquirer.prompt([
    {
        type: "bool",
        name: "confirm",
        message: "Is that correct?",
        default: "true",
    },
]);

module.exports = {
    newProjectSetup: async () => {
        const options = await basicInfo();

        let configDone = false;
        const checks = [];
        const notifications = [];

        /* eslint-disable no-await-in-loop */
        while (!configDone) {
            const { choice } = await donePrompt();

            switch (choice) {
            case "check":
                checks.push(await newCheck());
                break;
            case "notification":
                notifications.push(await newNotification());
                break;
            default:
                configDone = true;
                break;
            }
        }
        /* eslint-enable no-await-in-loop */

        const newConfig = {
            ...options,
            checks,
            notifications,
        };

        console.log(yaml.safeDump(newConfig));

        const confirmation = await confirmOk();

        if (!confirmation) {
            return undefined;
        }

        return newConfig;
    },
};
