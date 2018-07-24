const { expandToServerlessConfig } = require("../../lib/serverless-config");

describe("httpEnabled", () => {
    it("sets aws lambda proxy event to trigger check", async () => {
        expect(expandToServerlessConfig({
            region: "eu-west-1",
            httpEnabled: true,
        })["eu-west-1"].functions["trigger-check"]).toEqual({
            handler: "node_modules/checkless/trigger-check.triggerCheck",
            environment: {
                makeRequestTopic: "${self:custom.makeRequestTopic}", // eslint-disable-line no-template-curly-in-string
            },
            events: [
                {
                    http: {
                        path: "check",
                        method: "post",
                        cors: true,
                    },
                },
            ],
        });
    });

    it("sets make-request to trigger on SNS topic", async () => {
        expect(expandToServerlessConfig({
            region: "eu-west-1",
            httpEnabled: true,
        })["eu-west-1"].functions["make-request"]).toEqual({
            handler: "node_modules/checkless/make-request.makeRequest",
            memorySize: 512,
            environment: {
                homeRegion: "eu-west-1",
                handleRequestTopic: "${self:custom.requestCompleteTopic}", // eslint-disable-line no-template-curly-in-string
            },
            events: [
                { sns: "${self:custom.makeRequestTopic}" }, // eslint-disable-line no-template-curly-in-string
            ],
        });
    });
});
