const sendOnTopicMap = {
    always: "checkComplete",
    fail: "checkFailed",
    success: "checkSucceeded",
};

const sendGetSnsTopic = (snsTopics, { sendOn = "always" }) => snsTopics[sendOnTopicMap[sendOn]];

module.exports = {
    notificationConfig: (snsTopics, globalNotifications = []) => globalNotifications
        .reduce((configuredGlobalNotifications, globalNotification) => {
            configuredGlobalNotifications["send-to-slack"] = {
                handler: "node_modules/checkless/send-to-slack.sendToSlack",
                memorySize: 512,
                environment: {
                    webhookUrl: globalNotification.slack.webhookUrl,
                },
                events: [
                    { sns: sendGetSnsTopic(snsTopics, globalNotification.slack) },
                ],
            };

            return configuredGlobalNotifications;
        }, {}),
};
