module.exports = {
    provider: ({ region, httpEnabled, service }, runtime) => ({
        name: "aws",
        runtime,
        iamRoleStatements: [
            {
                Effect: "Allow",
                Resource: "*",
                Action: ["sns:*"],
            },
        ],
        region,
        ...(httpEnabled ? { apiKeys: [service] } : {}),
    }),
};
