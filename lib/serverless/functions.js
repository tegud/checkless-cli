module.exports = {
    makeRequest: ({ requestComplete }, { checks }) => ({
        handler: "make-request.makeRequest",
        events: Object.keys(checks).map(checkName => ({
            schedule: {
                rate: `rate(${checks[checkName].checkEvery || "5 minutes"})`,
                input: {
                    url: checks[checkName].url,
                    region: "eu-west-1",
                    snsTopic: requestComplete,
                },
            },
        })),
    }),
    handleRequest: ({ checkComplete, checkFailed, requestComplete }, region) => ({
        handler: "handle-request.handleRequest",
        environment: {
            region,
            completeSnsTopic: checkComplete,
            failedSnsTopic: checkFailed,
        },
        events: [
            { sns: requestComplete },
        ],
    }),
};
