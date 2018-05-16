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
                    events: [
                        {
                            schedule: {
                                rate: "rate(5 minutes)",
                                input: {
                                    url: "http://localhost/",
                                    region: "eu-west-1",
                                    snsTopic: "${self:custom.requestCompleteTopic}", // eslint-disable-line no-template-curly-in-string
                                },
                            },
                        },
                    ],
                },
            },
        });
    });
});
