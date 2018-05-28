const { expandToServerlessConfig } = require("../../lib/serverless-config");

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
            "eu-west-1": {
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
                    checkSucceededTopic: "checkless-check-succeeded",
                    requestCompleteTopic: "checkless-site-check-complete",
                },
                functions: {
                    "make-request": {
                        handler: "node_modules/checkless/make-request.makeRequest",
                        memorySize: 512,
                        events: [
                            {
                                schedule: {
                                    rate: "rate(5 minutes)",
                                    input: {
                                        homeRegion: "eu-west-1",
                                        snsTopic: "${self:custom.requestCompleteTopic}", // eslint-disable-line no-template-curly-in-string
                                        url: "http://localhost/",
                                    },
                                },
                            },
                        ],
                    },
                    "handle-request": {
                        handler: "node_modules/checkless/handle-request.handleRequest",
                        memorySize: 256,
                        environment: {
                            completeSnsTopic: "${self:custom.checkCompleteTopic}", // eslint-disable-line no-template-curly-in-string
                            failedSnsTopic: "${self:custom.checkFailedTopic}", // eslint-disable-line no-template-curly-in-string
                            succeededSnsTopic: "${self:custom.checkSucceededTopic}", // eslint-disable-line no-template-curly-in-string
                            region: "eu-west-1",
                        },
                        events: [
                            { sns: "${self:custom.requestCompleteTopic}" }, // eslint-disable-line no-template-curly-in-string
                        ],
                    },
                },
            },
        });
    });

    it("sets basic configuration for us-east-1", async () => {
        expect(expandToServerlessConfig({
            region: "us-east-1",
            checks: {
                localhost: {
                    url: "http://localhost/",
                    regions: ["us-east-1"],
                },
            },
        })).toEqual({
            "us-east-1": {
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
                    region: "us-east-1",
                },
                custom: {
                    checkCompleteTopic: "checkless-check-complete",
                    checkFailedTopic: "checkless-check-failed",
                    checkSucceededTopic: "checkless-check-succeeded",
                    requestCompleteTopic: "checkless-site-check-complete",
                },
                functions: {
                    "make-request": {
                        handler: "node_modules/checkless/make-request.makeRequest",
                        memorySize: 512,
                        events: [
                            {
                                schedule: {
                                    rate: "rate(5 minutes)",
                                    input: {
                                        homeRegion: "us-east-1",
                                        snsTopic: "${self:custom.requestCompleteTopic}", // eslint-disable-line no-template-curly-in-string
                                        url: "http://localhost/",
                                    },
                                },
                            },
                        ],
                    },
                    "handle-request": {
                        handler: "node_modules/checkless/handle-request.handleRequest",
                        memorySize: 256,
                        environment: {
                            completeSnsTopic: "${self:custom.checkCompleteTopic}", // eslint-disable-line no-template-curly-in-string
                            failedSnsTopic: "${self:custom.checkFailedTopic}", // eslint-disable-line no-template-curly-in-string
                            succeededSnsTopic: "${self:custom.checkSucceededTopic}", // eslint-disable-line no-template-curly-in-string
                            region: "us-east-1",
                        },
                        events: [
                            { sns: "${self:custom.requestCompleteTopic}" }, // eslint-disable-line no-template-curly-in-string
                        ],
                    },
                },
            },
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
            })["eu-west-1"].functions["make-request"].events[0].schedule.rate).toBe("rate(1 minute)");
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
            })["eu-west-1"].functions["make-request"].events[0].schedule.rate).toBe("rate(5 minutes)");
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
            })["eu-west-1"].service).toBe("my-service");
        });

        it("sets prefixes SNS topic names", () => {
            expect(expandToServerlessConfig({
                service: "my-service",
                region: "eu-west-1",
                checks: {
                    localhost: {
                        url: "http://localhost/",
                        regions: ["eu-west-1"],
                    },
                },
            })["eu-west-1"].custom).toEqual({
                requestCompleteTopic: "my-service-site-check-complete",
                checkCompleteTopic: "my-service-check-complete",
                checkSucceededTopic: "my-service-check-succeeded",
                checkFailedTopic: "my-service-check-failed",
            });
        });
    });

    describe("multiple regions", () => {
        it("includes check function in us-east-1", () => {
            expect(expandToServerlessConfig({
                region: "eu-west-1",
                checks: {
                    localhost: {
                        url: "http://localhost/",
                        regions: ["us-east-1"],
                    },
                    localhost2: {
                        url: "http://localhost:8080/",
                        regions: ["eu-west-1"],
                    },
                },
            })["us-east-1"]).toEqual({
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
                    region: "us-east-1",
                },
                custom: {
                    checkCompleteTopic: "checkless-check-complete",
                    checkFailedTopic: "checkless-check-failed",
                    checkSucceededTopic: "checkless-check-succeeded",
                    requestCompleteTopic: "checkless-site-check-complete",
                },
                functions: {
                    "make-request": {
                        handler: "node_modules/checkless/make-request.makeRequest",
                        memorySize: 512,
                        events: [
                            {
                                schedule: {
                                    rate: "rate(5 minutes)",
                                    input: {
                                        homeRegion: "eu-west-1",
                                        snsTopic: "${self:custom.requestCompleteTopic}", // eslint-disable-line no-template-curly-in-string
                                        url: "http://localhost/",
                                    },
                                },
                            },
                        ],
                    },
                },
            });
        });
    });
});
