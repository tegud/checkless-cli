const { expandToServerlessConfig } = require("../lib/serverless");

describe("expand to serverless config", () => {
    it("sets basic configuration for single region check", async () => {
        expect(expandToServerlessConfig({
            region: "eu-west-1",
            checks: {
                localhost: {
                    url: "http://localhost/",
                    regions: ["eu-west-1"],
                },
            },
        })).toEqual({
            service: "checkless",
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
                region: "eu-west-1",
            },
            custom: {
                checkCompleteTopic: "checkless-check-complete",
                checkFailedTopic: "checkless-check-failed",
                requestCompleteTopic: "checkless-site-check-complete",
            },
            functions: {
                "make-request": {
                    handler: "make-request.makeRequest",
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

    describe("check schedule", () => {
        it("set to configured value", async () => {
            expect(expandToServerlessConfig({
                checks: {
                    localhost: {
                        url: "http://localhost/",
                        checkEvery: "1 minute",
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
            }).functions["make-request"].events[0].schedule.rate).toBe("rate(1 minute)");
        });

        it("defaults to 5minutes", async () => {
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
            }).functions["make-request"].events[0].schedule.rate).toBe("rate(5 minutes)");
        });
    });

    describe("service name", () => {
        it("sets service property", () => {
            expect(expandToServerlessConfig({
                service: "my-service",
                region: "eu-west-1",
                checks: {
                    localhost: {
                        url: "http://localhost/",
                        regions: ["eu-west-1"],
                    },
                },
            }).service).toBe("my-service");
        });
    });
});
