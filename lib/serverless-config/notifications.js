const sendOnTopicMap = {
    always: "checkComplete",
    fail: "checkFailed",
    success: "checkSucceeded",
};

const sendGetSnsTopic = (snsTopics, { sendOn = "always" }) => snsTopics[sendOnTopicMap[sendOn]];

const notificationBuilds = {
    slack: {
        appendTo: "notificationFunctions",
        property: "send-to-slack",
        builder: (snsTopics, config) => ({
            handler: "node_modules/checkless/send-to-slack.sendToSlack",
            memorySize: 512,
            environment: {
                webhookUrl: config.webhookUrl,
            },
            events: [
                { sns: sendGetSnsTopic(snsTopics, config) },
            ],
        }),
    },
    webhook: {
        appendTo: "notificationFunctions",
        property: "send-to-webhook",
        builder: (snsTopics, config) => ({
            handler: "node_modules/checkless/send-to-webhook.sendToWebhook",
            memorySize: 512,
            environment: {
                webhookUrl: config.webhookUrl,
            },
            events: [
                { sns: sendGetSnsTopic(snsTopics, config) },
            ],
        }),
    },
    email: {
        appendTo: "notificationResources",
        property: "MailQueue",
        builder: (snsTopics, config) => ({
            Type: "AWS::SNS::Topic",
            Properties: {
                DisplayName: "Checkless",
                TopicName: sendGetSnsTopic(
                    snsTopics,
                    config,
                ),
                Subscription: [
                    {
                        Endpoint: config.sendTo,
                        Protocol: "email",
                    },
                ],
            },
        }),
    },
};

module.exports = {
    notificationConfig: (snsTopics, globalNotifications = []) => globalNotifications
        .reduce((configuredNotifications, globalNotification) => {
            const notificationType = Object.keys(globalNotification)[0];
            const { appendTo, property, builder } = notificationBuilds[notificationType];

            const notification = builder(
                snsTopics,
                globalNotification[notificationType],
            );

            configuredNotifications[appendTo][property] = notification;

            return configuredNotifications;
        }, {
            notificationFunctions: {},
            notificationResources: {},
        }),
};
