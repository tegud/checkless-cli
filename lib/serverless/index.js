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

        return {
            "eu-west-1": {
                service,
                custom,
                provider: provider(config, "nodejs8.10"),
                functions: {
                    "make-request": makeRequest(snsTopics, config),
                    "handle-request": handleRequest(snsTopics, "eu-west-1"),
                    ...notificationConfig(snsTopics, config.notifications),
                },
            },
        };
    },
};
