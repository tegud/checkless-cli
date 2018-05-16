module.exports = {
    expandToServerlessConfig: async (config) => {
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
            },
        };
    },
};
