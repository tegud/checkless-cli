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
        notificationBuilder: (snsTopics, config) => ({
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
    email: {
        appendTo: "notificationResources",
        property: "MailQueue",
        notificationBuilder: (snsTopics, config) => ({
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
        .reduce((configuredGlobalNotifications, globalNotification) => {
            const notificationType = Object.keys(globalNotification)[0];
            const notificationBuilder = notificationBuilds[notificationType];
            const notification = notificationBuilder.notificationBuilder(
                snsTopics,
                globalNotification[notificationType],
            );
            const notificationRoot = configuredGlobalNotifications[notificationBuilder.appendTo];

            notificationRoot[notificationBuilder.property] = notification;

            return configuredGlobalNotifications;
        }, { notificationFunctions: {}, notificationResources: {} }),
};
