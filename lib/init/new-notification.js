const inquirer = require("inquirer");

const notificationOptions = {
    slack: async () => inquirer.prompt([
        {
            type: "input",
            name: "webhookUrl",
            message: "Slack Webhook URL",
        },
    ])
        .then(({ webhookUrl }) => ({ slack: { webhookUrl } })),
};

const newNotification = async () => inquirer.prompt([
    {
        type: "list",
        name: "type",
        message: "Notification Type",
        choices: [
            "Slack",
        ].map(option => ({
            key: option,
            value: option.toLowerCase(),
        })),
    },
])
    .then(({ type }) => notificationOptions[type]());

module.exports = {
    newNotification,
};
