import morgan, { token } from "morgan";
import chalk from "chalk";
import httpStatus from "http-status"
const customMorganFormat = (tokens, req, res) => {
    const timestamp = chalk.bold(
        chalk.gray(
            new Date().toLocaleDateString() +
                " " +
                new Date().toLocaleTimeString()
        )
    );
    const status = tokens.status(req, res);
    const statusColor = status >= 400 ? chalk.red : chalk.green;
    const statusMessage = httpStatus[status] || "Unknown Status"; // Get status text dynamically
    return [
        timestamp,
        chalk.bold(statusColor(`[${tokens.method(req, res)}]`)),
        "===>>",
        chalk.bold(chalk.bgBlackBright(tokens.url(req, res))),
        "  ",
        chalk.bold(statusColor(status)),
        chalk.yellow(`[${statusMessage}]`), // Status Description
        chalk.bold(tokens.res(req, res, "content-length")),
        " - ",
        chalk.bold(tokens["response-time"](req, res)),
        "ms",
    ].join(" ");
};

const requestLogger = morgan(customMorganFormat);

/**
 * Logs messages to the console with different log levels.
 * @param {"info"|"warn"|"error"|"debug"|"success"} type - The type of log.
 * @param {string|object} message - The message or data to log.
 */
const logMessage = (type, message) => {
    const timestamp =
        new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();

    let logTypes = {
        info: chalk.bold(chalk.blue("[INFO]")),
        warn: chalk.bold(chalk.yellow("[WARN]")),
        error: chalk.bold(chalk.red("[ERROR]")),
        debug: chalk.bold(chalk.magenta("[DEBUG]")),
        success: chalk.bold(chalk.green("[SUCCESS]")),
    };

    const logType = logTypes[type];
    const formattedMessage =
        typeof message === "object" ? JSON.stringify(message) : message;

    console.log(`${chalk.gray(timestamp)} ${logType} ${formattedMessage}`);
};

const logger = { logMessage, requestLogger };

export default logger;

logMessage("info", "testing the logger function");
logMessage("warn", "testing the logger function");
logMessage("error", "testing the logger function");
logMessage("debug", "testing the logger function");
logMessage("success", "testing the logger function");
