const { estimate } = require("serverless-cost-estimate");

const functionBillingDurationCalculators = {
    "make-request": () => 1000,
    "handle-request": () => 100,
    "send-to-slack": () => 300,
};

const getExecutionsPerMonth = (rate) => {
    const timeComponentMatch = /rate\(([0-9]+) ([^)]+)\)/.exec(rate);

    if (timeComponentMatch[2].startsWith("minute")) {
        return (60 * 24 * 30) / parseInt(timeComponentMatch[1], 10);
    }

    if (timeComponentMatch[2].startsWith("second")) {
        return (60 * 60 * 24 * 30) / parseInt(timeComponentMatch[1], 10);
    }

    return 0;
};

module.exports = {
    estimate: ({ serverlessConfig, freeTier }) => {
        const functions = Object.keys(serverlessConfig)
            .reduce((allFunctions, region) => [
                ...allFunctions,
                ...Object.keys(serverlessConfig[region].functions)
                    .reduce((allRegionFunctions, functionName) => [
                        ...allRegionFunctions,
                        {
                            functionName,
                            region,
                            ...serverlessConfig[region].functions[functionName],
                        },
                    ], []),
            ], []);

        const billableFunctions = functions.map(fn => ({
            region: fn.region,
            name: fn.functionName,
            handler: fn.handler,
            memory: fn.memory || 1024,
            executionTime: functionBillingDurationCalculators[fn.functionName](),
            events: fn.events.reduce((allEvents, current) => [
                ...allEvents,
                {
                    type: Object.keys(current)[0],
                    ...(typeof current[Object.keys(current)[0]] === "object"
                        ? { rate: current[Object.keys(current)[0]].rate }
                        : { target: current[Object.keys(current)[0]] }
                    ),
                },
            ], []),
        }));

        const checkFunctions = billableFunctions
            .filter(check => check.name === "make-request")
            .reduce((allCheckFunctions, current) => [
                ...allCheckFunctions, {
                    name: `${current.region}|make-request|${current.memory}mb`,
                    executionTime: current.executionTime,
                    memory: current.memory,
                    executions: current.events.reduce((totalExecutions, currentEvent) =>
                        totalExecutions + getExecutionsPerMonth(currentEvent.rate), 0),
                },
            ], []);

        const totalcheckExecutions = checkFunctions.reduce((total, current) =>
            total + current.executions, 0);

        const handleRequests = billableFunctions
            .filter(check => check.name === "handle-request")
            .reduce((allHandleRequestFunctions, current) => [
                ...allHandleRequestFunctions, {
                    name: `${current.region}|handle-request|${current.memory}mb`,
                    executionTime: current.executionTime,
                    memory: current.memory,
                    executions: totalcheckExecutions,
                },
            ], []);

        const notifierRequests = billableFunctions
            .filter(check => !["make-request", "handle-request"].includes(check.name))
            .reduce((allHandleRequestFunctions, current) => [
                ...allHandleRequestFunctions, {
                    name: `${current.region}|${current.name}|${current.memory}mb`,
                    executionTime: current.executionTime,
                    memory: current.memory,
                    executions: totalcheckExecutions,
                },
            ], []);

        return estimate({
            provider: "aws",
            functions: [
                ...checkFunctions,
                ...handleRequests,
                ...notifierRequests,
            ],
            freeTier,
        });
    },
};
