const { listRegions } = require("../aws-region-list");

const inquirer = require("inquirer");

const newCheck = async () => inquirer.prompt([
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
        choices: listRegions().map(region => ({ name: region.name, value: region.code })),
        default: "eu-west-1",
        validate: (value) => {
            if (!value.length) {
                return "Please select at least one region";
            }

            return true;
        },
    },
]);

module.exports = {
    newCheck,
};
