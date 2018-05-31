const { listRegions } = require("../aws-region-list");

const { prompt } = require("inquirer");

const newCheck = async () => prompt([
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
        name: "regions",
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
    {
        type: "input",
        name: "timeout",
        message: "Timeout (Maximum time in milliseconds for the request to complete within)",
        default: 3000,
        validate: (value) => {
            if (!/^[0-9]+$/.exec(value)) {
                return "Please enter a valid, whole number";
            }

            return true;
        },
    },
])
    .then(({ timeout, ...otherProperties }) => ({
        ...otherProperties,
        timeout: parseInt(timeout, 10),
    }));

module.exports = {
    newCheck,
};
