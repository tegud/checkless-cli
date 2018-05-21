module.exports = {
    makeRequest: ({ requestComplete }, { checks, region }, currentRegion) => ({
        handler: "node_modules/checkless/make-request.makeRequest",
        events: Object.keys(checks)
            .filter(checkName => checks[checkName].regions.includes(currentRegion))
            .map(checkName => ({
                schedule: {
                    rate: `rate(${checks[checkName].checkEvery || "5 minutes"})`,
                    input: {
                        url: checks[checkName].url,
                        homeRegion: region,
                        snsTopic: requestComplete,
                    },
                },
            })),
    }),
    handleRequest: ({ checkComplete, checkFailed, requestComplete }, region) => ({
        handler: "node_modules/checkless/handle-request.handleRequest",
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
