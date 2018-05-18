module.exports = {
    notificationConfig: ({ checkComplete }, globalNotifications = []) => globalNotifications
        .reduce((configuredGlobalNotifications, globalNotification) => {
            configuredGlobalNotifications["send-to-slack"] = {
                handler: "send-to-slack.sendToSlack",
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
