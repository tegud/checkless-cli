const { notificationConfig } = require("./notifications");
const { provider } = require("./provider");
const { makeRequest, handleRequest } = require("./functions");

const snsTopics = {
    checkComplete: "${self:custom.checkCompleteTopic}", // eslint-disable-line no-template-curly-in-string
    checkFailed: "${self:custom.checkFailedTopic}", // eslint-disable-line no-template-curly-in-string
    requestComplete: "${self:custom.requestCompleteTopic}", // eslint-disable-line no-template-curly-in-string
};

module.exports = {
    expandToServerlessConfig: (config) => {
        const service = config.service || "checkless";
        const custom = {
            requestCompleteTopic: `${service}-site-check-complete`,
            checkCompleteTopic: `${service}-check-complete`,
            checkFailedTopic: `${service}-check-failed`,
        };

        const coreServerlessConfig = {};

        coreServerlessConfig["eu-west-1"] = {
            service,
            custom,
            provider: provider(config, "nodejs8.10"),
            functions: {
                "make-request": makeRequest(snsTopics, config, "eu-west-1"),
                "handle-request": handleRequest(snsTopics, "eu-west-1"),
                ...notificationConfig(snsTopics, config.notifications),
            },
        };

        const checkRegions = Object.keys(config.checks).reduce((allRegions, checkName) => [
            ...allRegions,
            ...config.checks[checkName].regions.filter(region => !allRegions.includes(region)),
        ], []);

        const serverlessConfig = checkRegions.filter(region => region !== "eu-west-1").reduce((allConfig, region) => {
            allConfig[region] = {
                service,
                custom,
                provider: provider({ region }, "nodejs8.10"),
                functions: {
                    "make-request": makeRequest(snsTopics, config, region),
                },
            };

            return allConfig;
        }, { ...coreServerlessConfig });

        return serverlessConfig;
    },
};
