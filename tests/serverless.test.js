const { expandToServerlessConfig } = require("../lib/serverless");

describe("expand to serverless config", () => {
    it("sets basic configuration for single region check", async () => {
        expect(await expandToServerlessConfig({
            checks: {
                localhost: {
                    url: "http://localhost/",
                    regions: ["eu-west-1"],
                },
            },
        })).toEqual({
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
                "send-to-slack": {
                    handler: "send-to-slack.sendToSlack",
                    environment: {
                        webhookUrl: undefined,
                    },
                    events: [
                        { sns: "${self:custom.checkCompleteTopic}" }, // eslint-disable-line no-template-curly-in-string
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
            resources: {
                Resources: {
                    MailQueue: {
                        Properties: {
                            DisplayName: "Checkless",
                            Subscription: [
                                {
                                    Endpoint: undefined,
                                    Protocol: "email",
                                },
                            ],
                            TopicName: "${self:custom.checkFailedTopic}", // eslint-disable-line no-template-curly-in-string
                        },
                        Type: "AWS::SNS::Topic",
                    },
                },
            },
            service: "checkless",
        });
    });
});
