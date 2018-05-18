module.exports = {
    provider: ({ region }, runtime) => ({
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
    }),
};
