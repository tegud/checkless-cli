const { listRegions } = require("../aws-region-list");

const inquirer = require("inquirer");

const basicInfo = async () => inquirer.prompt([
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
        choices: listRegions().map(region => ({ name: region.name, value: region.code })),
        default: "eu-west-1",
    },
]);

module.exports = {
    basicInfo,
};
