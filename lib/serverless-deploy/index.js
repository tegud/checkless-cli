const { spawn } = require("child_process");

const execServerless = async region => new Promise((resolve, reject) => {
    const serverless = spawn("serverless", [
        "deploy",
    ], {
        cwd: `${process.cwd()}/.checkless/${region}`,
        stdio: "pipe",
        env: process.env,
    });

    serverless.on("error", (data) => {
        console.error(data.toString("utf-8"));
    });

    serverless.on("close", (code) => {
        if (code) {
            reject(new Error(`Serverless exited with code: ${code}`));
            return;
        }

        resolve();
    });
});

module.exports = {
    execServerless,
};
