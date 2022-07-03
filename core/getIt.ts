import "reflect-metadata";
import { container } from "tsyringe";
import { ClientsApi, Configuration, InvitationsApi, OrganizationsApi, TripsApi, UserprofilesApi } from "./apiClient";
import { NotificationService, NotificationServiceImpl } from "./services/notificationService";
import { getLoggingInstance } from "./utils/logger";
import * as portableFetch from "portable-fetch";
import configuration from "../utils/configuration";

function _fetch(url: any, options: any) {
    const clientInfo = require("../core/apiClient/client.version.json");
    const headers = { ...options || {} }.headers || {};
    headers["x-fleetonroute-client-api-version"] = clientInfo["version"];
    return portableFetch(url, options);
}

let isRegistered = false;
const logger = getLoggingInstance("DIRegistry");
export function registerDependencies() {
    if (isRegistered) {
        return;
    }
    container.register("NotificationService", { useValue: new NotificationServiceImpl() });
    container.register("ApiConfiguration", { useValue: configuration });

    container.register("UserprofilesApi", {
        useFactory: (c) => {
            return new UserprofilesApi(c.resolve<Configuration>("ApiConfiguration"), process.env.REACT_APP_CLOUD_FUNCTION_ENDPOINT, _fetch);
        }
    });
    container.register("OrganizationsApi", {
        useFactory: (c) => {
            return new OrganizationsApi(c.resolve<Configuration>("ApiConfiguration"), process.env.REACT_APP_CLOUD_FUNCTION_ENDPOINT, _fetch);
        }
    });
    container.register("InvitationsApi", {
        useFactory: (c) => {
            return new InvitationsApi(c.resolve<Configuration>("ApiConfiguration"), process.env.REACT_APP_CLOUD_FUNCTION_ENDPOINT, _fetch);
        }
    });

    container.register("TripsApi", {
        useFactory: (c) => {
            return new TripsApi(c.resolve<Configuration>("ApiConfiguration"), process.env.REACT_APP_CLOUD_FUNCTION_ENDPOINT, _fetch);
        }
    });

    container.register("ClientsApi", {
        useFactory: (c) => {
            return new ClientsApi(c.resolve<Configuration>("ApiConfiguration"), process.env.REACT_APP_CLOUD_FUNCTION_ENDPOINT, _fetch);
        }
    });
    isRegistered = true;
}

export function _UserprofilesApi() { return container.resolve<UserprofilesApi>("UserprofilesApi"); }
export function _NotificationService() { return container.resolve<NotificationService>("NotificationService") };
export function _OrganizationsApi() { return container.resolve<OrganizationsApi>("OrganizationsApi") };
export function _ClientsApi() { return container.resolve<ClientsApi>("ClientsApi") };
export function _InvitationsApi() { return container.resolve<InvitationsApi>("InvitationsApi") };
export function _TripsApi() { return container.resolve<TripsApi>("TripsApi") };


