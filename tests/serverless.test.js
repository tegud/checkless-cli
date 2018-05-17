const { expandToServerlessConfig } = require("../lib/serverless");

describe("expand to serverless config", () => {
    it("sets basic configuration for single region check", async () => {
        expect(expandToServerlessConfig({
            checks: {
                localhost: {
                    url: "http://localhost/",
                    regions: ["eu-west-1"],
                },
            },
        })).toEqual({
            service: "checkless",
            custom: {
                checkCompleteTopic: "check-complete",
                checkFailedTopic: "check-failed",
                requestCompleteTopic: "site-check-complete",
            },
            functions: {
                "make-request": {
                    events: [
                        {
                            schedule: {
                                rate: "rate(5 minutes)",
                                input: {
                                    region: "eu-west-1",
                                    snsTopic: "${self:custom.requestCompleteTopic}", // eslint-disable-line no-template-curly-in-string
                                    url: "http://localhost/",
                                },
                            },
                        },
                    ],
                    handler: "make-request",
                },
                "handle-request": {
                    handler: "handle-request.handleRequest",
                    environment: {
                        completeSnsTopic: "${self:custom.checkCompleteTopic}", // eslint-disable-line no-template-curly-in-string
                        failedSnsTopic: "${self:custom.checkFailedTopic}", // eslint-disable-line no-template-curly-in-string
                        region: "eu-west-1",
                    },
                    events: [
                        { sns: "${self:custom.requestCompleteTopic}" }, // eslint-disable-line no-template-curly-in-string
                    ],
                },
            },
            provider: {
                iamRoleStatements: [
                    {
                        Action: ["sns:*"],
                        Effect: "Allow",
                        Resource: "*",
                    },
                ],
                name: "aws",
                runtime: "nodejs8.10",
            },
        });
    });

    it("includes send to slack function if slack set as global notifier", async () => {
        expect(expandToServerlessConfig({
            checks: {
                localhost: {
                    url: "http://localhost/",
                    regions: ["eu-west-1"],
                },
            },
            notifications: [
                {
                    slack: {
                        webhookUrl: "https://slackwebhookurl.com/go",
                    },
                },
            ],
        }).functions["send-to-slack"]).toEqual({
            handler: "send-to-slack.sendToSlack",
            environment: {
                webhookUrl: "https://slackwebhookurl.com/go",
            },
            events: [
                { sns: "${self:custom.checkCompleteTopic}" }, // eslint-disable-line no-template-curly-in-string
            ],
        });
    });
});
