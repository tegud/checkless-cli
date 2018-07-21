const { notificationConfig } = require("./notifications");
const { provider } = require("./provider");
const { makeRequest, handleRequest, triggerCheck } = require("./functions");

/* eslint-disable no-template-curly-in-string */
const snsTopics = {
    checkComplete: "${self:custom.checkCompleteTopic}",
    checkFailed: "${self:custom.checkFailedTopic}",
    checkSucceeded: "${self:custom.checkSucceededTopic}",
    requestComplete: "${self:custom.requestCompleteTopic}",
};
/* eslint-enable no-template-curly-in-string */

module.exports = {
    expandToServerlessConfig: (config) => {
        const service = config.service || "checkless";
        const homeRegion = config.region || "eu-west-1";
        const custom = {
            requestCompleteTopic: `${service}-site-check-complete`,
            checkCompleteTopic: `${service}-check-complete`,
            checkFailedTopic: `${service}-check-failed`,
            checkSucceededTopic: `${service}-check-succeeded`,
        };

        const coreServerlessConfig = {};
        const {
            notificationFunctions,
            notificationResources,
        } = notificationConfig(snsTopics, config.notifications);

        const resources = Object.keys(notificationResources).length ? {
            resources: {
                Resources: notificationResources,
            },
        } : {};

        const additionalFunctions = config.httpEnabled ? {
            "trigger-check": triggerCheck(),
        } : undefined;

        coreServerlessConfig[homeRegion] = {
            service,
            custom,
            provider: provider(config, "nodejs8.10"),
            functions: {
                "make-request": makeRequest(snsTopics, config, homeRegion),
                "handle-request": handleRequest(snsTopics, homeRegion),
                ...additionalFunctions,
                ...notificationFunctions,
            },
            ...resources,
        };

        const { checks = {} } = config;

        const checkRegions = Object.keys(checks).reduce((allRegions, checkName) => [
            ...allRegions,
            ...checks[checkName].regions.filter(region => !allRegions.includes(region)),
        ], []);

        const serverlessConfig = checkRegions
            .filter(region => region !== homeRegion)
            .reduce((allConfig, region) => {
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
