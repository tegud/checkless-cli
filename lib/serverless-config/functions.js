module.exports = {
    makeRequest: ({ requestComplete }, { checks = {}, region }, currentRegion) => ({
        handler: "node_modules/checkless/make-request.makeRequest",
        memorySize: 512,
        events: Object.keys(checks)
            .filter(checkName => checks[checkName].regions.includes(currentRegion)
                && checks[checkName].checkEvery !== "never")
            .map(checkName => ({
                schedule: {
                    rate: `rate(${checks[checkName].checkEvery || "5 minutes"})`,
                    input: {
                        url: checks[checkName].url,
                        homeRegion: region,
                        snsTopic: requestComplete,
                        ...checks[checkName].expect,
                    },
                },
            })),
    }),
    handleRequest: (snsTopics, region) => {
        const {
            checkComplete,
            checkFailed,
            checkSucceeded,
            requestComplete,
        } = snsTopics;

        return {
            handler: "node_modules/checkless/handle-request.handleRequest",
            memorySize: 256,
            environment: {
                region,
                completeSnsTopic: checkComplete,
                failedSnsTopic: checkFailed,
                succeededSnsTopic: checkSucceeded,
            },
            events: [
                { sns: requestComplete },
            ],
        };
    },
    triggerCheck: () => ({
        handler: "node_modules/checkless/trigger-check.triggerCheck",
        events: [
            { http: { path: "check", method: "post", cors: true } },
        ],
    }),
};
