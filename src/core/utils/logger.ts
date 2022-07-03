import Logger, { configure, Level } from 'nightingale';
import BrowserConsoleHandler from 'nightingale-browser-console';

const logLevel: string = (process.env.REACT_APP_LOGGER_LEVEL || "ALL").toUpperCase();

configure([
    { handlers: [new BrowserConsoleHandler(Level[logLevel])] }
]);

export function getLoggingInstance(name: string = "default") {
    // return logger;r
    return new Logger(name.replace(".", ""));
}

export default getLoggingInstance();