const checklessRoot = "node_modules/checkless/";

const makeRequest = (snsTopics, options, currentRegion) => {
    const { makeRequestTopic, requestComplete } = snsTopics;
    const {
        checks = {},
        region,
        httpEnabled = false,
    } = options;

    return {
        handler: `${checklessRoot}make-request.makeRequest`,
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
                            ...(checks[checkName].followRedirect === false
                                ? { followRedirect: checks[checkName].followRedirect }
                                : {}),
                            ...checks[checkName].expect,
                        },
                    },
                })),
            ...httpEnabled ? [{ sns: makeRequestTopic }] : [],
        ],
    };
};

const handleRequest = (snsTopics, region) => {
    const {
        checkComplete,
        checkFailed,
        checkSucceeded,
        requestComplete,
    } = snsTopics;

    return {
        handler: `${checklessRoot}handle-request.handleRequest`,
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
};

const triggerCheck = ({ makeRequestTopic }) => ({
    handler: `${checklessRoot}trigger-check.triggerCheck`,
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
});

module.exports = {
    makeRequest,
    handleRequest,
    triggerCheck,
};
