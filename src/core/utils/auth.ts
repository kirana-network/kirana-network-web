import firebase from "firebase";
import { container } from "tsyringe";
import { Configuration } from "../apiClient";
import { getLoggingInstance } from "./logger";
import dayjs from "dayjs";

let refreshInterval: any;
const REFRESH_INTERVAL = 1000 * 60 * 5; // 5 minutes
const logger = getLoggingInstance('auth-ts');

export function startRefreshTokenInterval(refresh: boolean = false) {
    clearRefreshTokenInterval();
    logger.info("startRefreshTokenInterval", { refresh });
    refreshInterval = setInterval(() => {
        logger.info("Refreshing Token / Configuration", { currentUser: firebase.auth().currentUser });
        doRefreshToken();
    }, REFRESH_INTERVAL);
}

export function doRefreshToken(refresh: boolean = false) {
    if (firebase.auth().currentUser) {
        firebase.auth().currentUser.getIdTokenResult(refresh)
            .then(result => {
                logger.info("Setting attachCredentialsToApiClient / Configuration", { result })
                attachCredentialsToApiClient(result.token);
                const expiryTime = dayjs(result.expirationTime);
                const now = dayjs();
                const diff = expiryTime.diff(now);
                logger.info("checking diff", { diff, REFRESH_INTERVAL, now, expiryTime })
                if (diff < (REFRESH_INTERVAL * 2)) {
                    doRefreshToken(true);
                }
            })
            .catch(error => logger.error(error));
    }
}

export function clearRefreshTokenInterval() {
    logger.info("clearRefreshTokenInterval");
    if (refreshInterval)
        clearInterval(refreshInterval);
}

export function attachCredentialsToApiClient(token: any) {
    const apiConfiguration = container.resolve<Configuration>("ApiConfiguration");
    if (token) {
        apiConfiguration.apiKey = (scheme) => scheme === "Authorization" ? token : null;
    }
    logger.info("Configuration", { apiConfiguration });
}
