const { prompt } = require("inquirer");

const sendOnPrompt = (defaultOption = "Failure Only") => [
    {
        type: "list",
        name: "sendOn",
        message: "Send On",
        choices: [
            { key: "always", value: "Always" },
            { key: "success", value: "Success Only" },
            { key: "fail", value: "Failure Only" },
        ],
        default: defaultOption,
    },
];

const notificationOptions = {
    slack: async () => prompt([
        {
            type: "input",
            name: "webhookUrl",
            message: "Slack Webhook URL",
        },
        ...sendOnPrompt("Always"),
    ])
        .then(({ webhookUrl, sendOn }) => ({ slack: { webhookUrl, sendOn } })),
    email: async () => prompt([
        {
            type: "input",
            name: "emailAddress",
            message: "Send to Email Address",
        },
        ...sendOnPrompt(),
    ])
        .then(({ emailAddress, sendOn }) => ({ email: { sendTo: emailAddress, sendOn } })),
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
