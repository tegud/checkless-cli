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
                        private: true,
                    },
                },
            ],
        });
    });

    it("sets api keys on aws provider config when service specified", async () => {
        expect(expandToServerlessConfig({
            service: "my-checkless",
            region: "eu-west-1",
            httpEnabled: true,
        })["eu-west-1"].provider.apiKeys).toEqual(["my-checkless"]);
    });

    it("sets api keys on aws provider config when service not specified", async () => {
        expect(expandToServerlessConfig({
            region: "eu-west-1",
            httpEnabled: true,
        })["eu-west-1"].provider.apiKeys).toEqual(["checkless"]);
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
