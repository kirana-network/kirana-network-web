import { getLoggingInstance } from "../utils/logger";

const logger = getLoggingInstance(__filename);

export function loadMessages(locale: string) {
    logger.trace("loading language", { locale });
    return safeLoadMessages(locale);
}

function safeLoadMessages(locale: string) {
    try {
        return require(`./${locale}.json`);
    }
    catch (error: any) {
        logger.error(error);
        return require("./en.json");
    }
}