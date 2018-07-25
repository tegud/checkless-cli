module.exports = {
    makeRequest: ({
        makeRequestTopic,
        requestComplete,
    }, {
        checks = {},
        region,
        httpEnabled = false,
    }, currentRegion) => ({
        handler: "node_modules/checkless/make-request.makeRequest",
        memorySize: 512,
        environment: {
            homeRegion: region,
            handleRequestTopic: requestComplete,
        },
        events: [
            ...Object.keys(checks)
                .filter(checkName => checks[checkName].regions.includes(currentRegion)
                    && checks[checkName].checkEvery !== "never")
                .map(checkName => ({
                    schedule: {
                        rate: `rate(${checks[checkName].checkEvery || "5 minutes"})`,
                        input: {
                            url: checks[checkName].url,
                            ...checks[checkName].expect,
                        },
                    },
                })),
            ...httpEnabled ? [{ sns: makeRequestTopic }] : [],
        ],
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
    triggerCheck: ({ makeRequestTopic }) => ({
        handler: "node_modules/checkless/trigger-check.triggerCheck",
        environment: { makeRequestTopic },
        events: [
            {
                http: {
                    path: "check",
                    method: "post",
                    cors: true,
                    private: true,
                },
            },
        ],
    }),
};
