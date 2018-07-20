const { prompt } = require("inquirer");

const notificationOptions = {
    slack: async () => prompt([
        {
            type: "input",
            name: "webhookUrl",
            message: "Slack Webhook URL",
        },
    ])
        .then(({ webhookUrl }) => ({ slack: { webhookUrl } })),
    email: async () => prompt([{
        type: "input",
        name: "emailAddress",
        message: "Send to Email Address",
    }])
        .then(({ emailAddress }) => ({ email: { sendTo: emailAddress } })),
};

const newNotification = async () => prompt([
    {
        type: "list",
        name: "type",
        message: "Notification Type",
        choices: [
            "Slack",
            "Email",
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
