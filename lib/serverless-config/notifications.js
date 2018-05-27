module.exports = {
    notificationConfig: ({ checkComplete }, globalNotifications = []) => globalNotifications
        .reduce((configuredGlobalNotifications, globalNotification) => {
            configuredGlobalNotifications["send-to-slack"] = {
                handler: "node_modules/checkless/send-to-slack.sendToSlack",
                memorySize: 512,
                environment: {
                    webhookUrl: globalNotification.slack.webhookUrl,
                },
                events: [
                    { sns: checkComplete },
                ],
            };

            return configuredGlobalNotifications;
        }, {}),
};
