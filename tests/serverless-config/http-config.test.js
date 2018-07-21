const { expandToServerlessConfig } = require("../../lib/serverless-config");

describe("httpEnabled", () => {
    it("sets aws lambda proxy event to do check", async () => {
        expect(expandToServerlessConfig({
            region: "eu-west-1",
            checks: {
                localhost: {
                    url: "http://localhost/",
                    regions: ["eu-west-1"],
                    checkEvery: "never",
                },
            },
            httpEnabled: true,
        })["eu-west-1"].functions["make-request"].events).toEqual([
            {
                http: {
                    path: "check",
                    method: "post",
                    cors: true,
                },
            },
        ]);
    });
});
