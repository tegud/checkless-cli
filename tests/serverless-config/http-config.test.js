const { expandToServerlessConfig } = require("../../lib/serverless-config");

describe("httpEnabled", () => {
    it("sets aws lambda proxy event to trigger check", async () => {
        expect(expandToServerlessConfig({
            region: "eu-west-1",
            httpEnabled: true,
        })["eu-west-1"].functions["trigger-check"]).toEqual({
            handler: "node_modules/checkless/trigger-check.triggerCheck",
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
});
