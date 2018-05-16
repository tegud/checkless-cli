const snsTopics = {
    checkComplete: "${self:custom.checkCompleteTopic}", // eslint-disable-line no-template-curly-in-string
    checkFailed: "${self:custom.checkFailedTopic}", // eslint-disable-line no-template-curly-in-string
    requestComplete: "${self:custom.requestCompleteTopic}", // eslint-disable-line no-template-curly-in-string
};

const baseFunctions = region => ({
    "handle-request": {
        handler: "handle-request.handleRequest",
        environment: {
            region,
            completeSnsTopic: snsTopics.checkComplete,
            failedSnsTopic: snsTopics.checkFailed,
        },
        events: [
            { sns: snsTopics.requestComplete },
        ],
    },
    "send-to-slack": {
        handler: "send-to-slack.sendToSlack",
        environment: { webhookUrl: process.env.SLACK_WEBHOOK_PATH },
        events: [
            { sns: snsTopics.checkComplete },
        ],
    },
});

module.exports = {
    expandToServerlessConfig: (config) => {
        console.log("IN");
        return {
            service: "checkless",
            custom: {
                requestCompleteTopic: "site-check-complete",
                checkCompleteTopic: "check-complete",
                checkFailedTopic: "check-failed",
            },
            provider: {
                name: "aws",
                runtime: "nodejs8.10",
                iamRoleStatements: [
                    {
                        Effect: "Allow",
                        Resource: "*",
                        Action: ["sns:*"],
                    },
                ],
            },
            functions: {
                "make-request": {
                    handler: "make-request",
                    events: Object.keys(config.checks).map(checkName => ({
                        schedule: {
                            rate: "rate(5 minutes)",
                            input: {
                                url: config.checks[checkName].url,
                                region: "eu-west-1",
                                snsTopic: "${self:custom.requestCompleteTopic}", // eslint-disable-line no-template-curly-in-string
                            },
                        },
                    })),
                },
                ...baseFunctions("eu-west-1"),
            },
            resources: {
                Resources: {
                    MailQueue: {
                        Type: "AWS::SNS::Topic",
                        Properties: {
                            DisplayName: "Checkless",
                            TopicName: snsTopics.checkFailed,
                            Subscription: [
                                {
                                    Endpoint: process.env.FAILURE_EMAIL_TO,
                                    Protocol: "email",
                                },
                            ],
                        },
                    },
                },
            },
        };
    },
};