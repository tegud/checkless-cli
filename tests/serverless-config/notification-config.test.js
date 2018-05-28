const { expandToServerlessConfig } = require("../../lib/serverless-config");

describe("expand to serverless config", () => {
    describe("slack notification", () => {
        it("includes send to slack function if slack set as global notifier", async () =>
            expect(expandToServerlessConfig({
                checks: {},
                notifications: [
                    {
                        slack: {
                            webhookUrl: "https://slackwebhookurl.com/go",
                        },
                    },
                ],
            })["eu-west-1"].functions["send-to-slack"]).toEqual({
                handler: "node_modules/checkless/send-to-slack.sendToSlack",
                memorySize: 512,
                environment: {
                    webhookUrl: "https://slackwebhookurl.com/go",
                },
                events: [
                    { sns: "${self:custom.checkCompleteTopic}" }, // eslint-disable-line no-template-curly-in-string
                ],
            }));

        it("targets check failed topic when set to sendOn fail only", async () =>
            expect(expandToServerlessConfig({
                checks: {},
                notifications: [
                    {
                        slack: {
                            sendOn: "fail",
                            webhookUrl: "https://slackwebhookurl.com/go",
                        },
                    },
                ],
            })["eu-west-1"].functions["send-to-slack"]).toEqual({
                handler: "node_modules/checkless/send-to-slack.sendToSlack",
                memorySize: 512,
                environment: {
                    webhookUrl: "https://slackwebhookurl.com/go",
                },
                events: [
                    { sns: "${self:custom.checkFailedTopic}" }, // eslint-disable-line no-template-curly-in-string
                ],
            }));

        it("targets check success topic when set to sendOn success only", async () =>
            expect(expandToServerlessConfig({
                checks: {},
                notifications: [
                    {
                        slack: {
                            sendOn: "success",
                            webhookUrl: "https://slackwebhookurl.com/go",
                        },
                    },
                ],
            })["eu-west-1"].functions["send-to-slack"]).toEqual({
                handler: "node_modules/checkless/send-to-slack.sendToSlack",
                memorySize: 512,
                environment: {
                    webhookUrl: "https://slackwebhookurl.com/go",
                },
                events: [
                    { sns: "${self:custom.checkSucceededTopic}" }, // eslint-disable-line no-template-curly-in-string
                ],
            }));
    });
});
