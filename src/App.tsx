import Box from '@mui/material/Box';
import { Routes, Route, useNavigate, useLocation, useResolvedPath, Navigate } from "react-router-dom";
import TopAppBar from './Components/Layout/TopAppBar';
import NavigationDrawer from './Components/Layout/NavigationDrawer';
import { LoginPage } from './Pages/LoginPage';
import { useEffect, useMemo, useState } from 'react';
import firebase from "firebase";
import { getLoggingInstance } from './core/utils/logger';
import Loading from './Components/Common/Loading';
import ListOrganizations from './Pages/Organizations/ListOrganizations';
import { UserProfileOrganization, Organization, ListOfOrganizations, UserProfile } from './core/apiClient';

import { _NotificationService, _OrganizationsApi, _UserprofilesApi } from './core/getIt';
import { useTranslate } from "react-polyglot";
import ClientRoute from './Pages/Clients/ShowClient';
import ShowTrip from './Pages/Trips/ShowTrip';
import MapPage from './Pages/MapPage';
import { CssBaseline, ThemeProvider } from '@mui/material';
import HomePage from './Pages/HomePage';
import CreateOrganizationForm from './Pages/Organizations/CreateOrganization';
import CreateClient from './Pages/Clients/CreateClient';
import CreateTrip from './Pages/Trips/CreateTrip';
import UserPage from './Pages/UserPage';
import getTheme from './theme';
import { attachCredentialsToApiClient, startRefreshTokenInterval, clearRefreshTokenInterval } from './core/utils/auth';
import OrganizationForm from './Pages/Organizations/OrganizationForm';
import OrganizationTeam from './Pages/Organizations/OrganizationTeam';
import OrganizationInvitations from './Pages/Organizations/OrganizationInvitations';
import ListOrganizationClients from './Pages/Organizations/ListOrganizationClients';
import ListOrganizationTrips from './Pages/Organizations/ListOrganizationTrips';
import { useSnackbar } from "notistack";
import React from 'react';
import LandingPage from './Pages/LandingPage';

const logger = getLoggingInstance(AdminApp.name);

const marginTop = "75px";
const marginLeft = "240px";

export default function AdminApp() {
    const [user, setUser] = useState<firebase.User>();
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const t = useTranslate();
    const location = useLocation();
    const resolvedPath = useResolvedPath(location.pathname);
    const [organization, setOrganization] = useState<Organization>();
    const [organizations, setOrganizations] = useState<Organization[]>();
    const mode = localStorage.getItem("mode") as any || "dark";
    const [theme, setTheme] = useState(getTheme(mode));
    console.log("themetheme", theme);
    const [menuOpen, setMenuOpen] = useState(true);
    const handleAuthChange = async () => {
        firebase.auth()
            .onIdTokenChanged(async user => {
                if (!user) {
                    setLoading(false);
                    return navigate("login");
                }

                const token = await user.getIdToken();
                attachCredentialsToApiClient(token);

                initializeUserProfile(user);
                setUser(user);
                logger.info("Connect to websocket now", { user, location, resolvedPath });
                _NotificationService().connect(token);
                const { organizations, organization } = await retrieveUserProfileOrganizations(user);
                if (organizations.length) {
                    setOrganization(organization);
                    setOrganizations(organizations);
                    if (location.pathname.includes("login")) {
                        navigate(`organizations/${organization.id}/details`);
                    }
                }
                else {
                    navigate("/home");
                }
                setLoading(false);
            });
    }

    useEffect(() => {
        logger.trace("useEffect.handleAuthChange");
        handleAuthChange();
    }, []);

    useEffect(() => {
        logger.trace("useEffect.user");
        if (user) {
            startRefreshTokenInterval();
        }
        return () => clearRefreshTokenInterval();
    }, [user]);

    if (loading) {
        return <Loading />
    }

    return (
        <>
            {/* <ThemeProvider theme={theme}> */}
            <CssBaseline />
            <TopAppBar
                title={t("app.title")}
                showButtons={!!user}
                showMenuIcon={!!user}
                organization={organization}
                organizations={organizations}
                onChange={(org: Organization) => setOrganization(org)}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                mode={mode}
            />
            <NavigationDrawer organization={organization} open={menuOpen} />
            <Box marginTop={marginTop} marginLeft={menuOpen ? marginLeft : 0} style={{ transitionProperty: "margin", transitionDuration: "0.25s" }}>
                <Routes>
                    {/* TODO: Group organizations using `organizations/*` */}
                    {user &&
                        <>
                            <Route path="/organizations" element={<ListOrganizations />} />
                            <Route path="/organizations/:id/clients" element={<ListOrganizationClients record={organization} />} />
                            <Route path="/organizations/:id/details" element={<OrganizationForm record={organization} />} />
                            <Route path="/organizations/:id/invitations" element={<OrganizationInvitations record={organization} />} />
                            <Route path="/organizations/:id/team" element={<OrganizationTeam record={organization} />} />
                            <Route path="/organizations/:id/*" element={<Navigate to={"details"} />} />
                            <Route path="/organizations/create" element={<CreateOrganizationForm record={{ ownerUserProfileId: user.uid }} onCreate={(org: Organization) => setOrganization(org)} />} />
                            <Route path="/organizations/:id/map" element={<MapPage record={organization} />} />
                            <Route path="/organizations/:id/trips" element={<ListOrganizationTrips record={organization} />} />
                            <Route path="/organizations/:organizationId/clients/create" element={<CreateClient />} />
                            <Route path="/organizations/:organizationId/clients/:clientId/*" element={<ClientRoute />} />
                            <Route path="/organizations/:organizationId/trips/create" element={<CreateTrip />} />
                            <Route path="/organizations/:organizationId/trips/:tripId" element={<ShowTrip />} />
                            <Route path="/userprofiles/:id/*" element={<UserPage />} />
                            <Route path="/home" element={<HomePage />} />
                            <Route path="*" element={<HomePage />} />
                        </>
                    }
                    {!user && <Route path="/login" element={<LoginPage />} />}
                </Routes>
            </Box>
            {/* </ThemeProvider> */}
        </>
    );
}

async function initializeUserProfile(user: firebase.User) {
    try {
        const retrieveUserProfile: UserProfile | undefined = await new Promise((resolve, reject) => _UserprofilesApi().retrieveUserProfile(user.uid).then(resolve).catch(e => resolve(null)));
        logger.trace("retrieveUserProfile", { retrieveUserProfile });
        if (!retrieveUserProfile) {
            const createResult = await new Promise((resolve, reject) => _UserprofilesApi().createUserProfile({
                email: user.email,
                firstName: user.displayName.split(" ")[0],
                lastName: user.displayName.split(" ")[1],
                id: user.uid
            })
                .then(resolve)
                .catch(reject));
        }
    }
    catch (error: any) {
        if (error.json) {
            error.json()
                .then(data => {
                    // Important: Do not show snackbar message in this scenario
                    // enqueueSnackbar(e.message, { variant: "error" })
                    logger.error("error", { data, error });
                })
                .catch(e => {
                    // Important: Do not show snackbar message in this scenario
                    // enqueueSnackbar(e.message, { variant: "error" })
                    logger.error(e);
                });
        }
        else { logger.error("error", { error }) };
    }
}

async function retrieveUserProfileOrganizations(user: firebase.User) {
    try {
        const userOrganizations: UserProfileOrganization[] = await new Promise((resolve, reject) => _UserprofilesApi().listUserProfileOrganizations(user.uid).then(resolve).catch(reject));
        const adminUserOrganizations = userOrganizations.filter(u => u.role == UserProfileOrganization.RoleEnum.ADMIN || u.role == UserProfileOrganization.RoleEnum.ASSOCIATE);
        if (adminUserOrganizations.length == 0) {
            return { organization: null, organizations: [] };
        }
        const organization: Organization = await new Promise((resolve, reject) =>
            _OrganizationsApi()
                .retrieveOrganization(adminUserOrganizations[0].organizationId)
                .then(resolve)
                .catch(reject)
        );
        const listOfOrganizations: ListOfOrganizations = await new Promise((resolve, reject) =>
            _OrganizationsApi()
                .listOrganizations("{}", "[]", JSON.stringify({ ids: adminUserOrganizations.map(o => o.organizationId) }))
                .then(resolve)
                .catch(reject)
        );
        return {
            organization, organizations: listOfOrganizations.records || []
        }
    }
    catch (error: any) {
        error.json()
            .then(data => {
                // Important: Do not show snackbar message in this scenario
                logger.error("error", { error, data });
            })
            .catch(e => {
                // Important: Do not show snackbar message in this scenario
                logger.error("error", { e, error });
            });
        return { organization: null, organizations: [] };;
    }
}



export function App() {
    // const [user, setUser] = useState<firebase.User>();
    // const [loading, setLoading] = useState(true);
    // const navigate = useNavigate();
    // const t = useTranslate();
    // const location = useLocation();
    // const resolvedPath = useResolvedPath(location.pathname);
    // const [organization, setOrganization] = useState<Organization>();
    // const [organizations, setOrganizations] = useState<Organization[]>();
    const mode = localStorage.getItem("mode") as any || "dark";
    const [theme, setTheme] = useState(getTheme(mode));
    console.log("themetheme", theme);
    const [menuOpen, setMenuOpen] = useState(false);
    // const handleAuthChange = async () => {
    //     firebase.auth()
    //         .onIdTokenChanged(async user => {
    //             if (!user) {
    //                 setLoading(false);
    //                 return navigate("login");
    //             }

    //             const token = await user.getIdToken();
    //             attachCredentialsToApiClient(token);

    //             initializeUserProfile(user);
    //             setUser(user);
    //             logger.info("Connect to websocket now", { user, location, resolvedPath });
    //             _NotificationService().connect(token);
    //             const { organizations, organization } = await retrieveUserProfileOrganizations(user);
    //             if (organizations.length) {
    //                 setOrganization(organization);
    //                 setOrganizations(organizations);
    //                 if (location.pathname.includes("login")) {
    //                     navigate(`organizations/${organization.id}/details`);
    //                 }
    //             }
    //             else {
    //                 navigate("/home");
    //             }
    //             setLoading(false);
    //         });
    // }

    // useEffect(() => {
    //     logger.trace("useEffect.handleAuthChange");
    //     handleAuthChange();
    // }, []);

    // useEffect(() => {
    //     logger.trace("useEffect.user");
    //     if (user) {
    //         startRefreshTokenInterval();
    //     }
    //     return () => clearRefreshTokenInterval();
    // }, [user]);

    // if (loading) {
    //     return <Loading />
    // }

    return (
        <>
            {/* <ThemeProvider theme={theme}> */}
            <CssBaseline />
            {/* <TopAppBar
                    title={t("app.title")}
                    showButtons={!!user}
                    showMenuIcon={!!user}
                    organization={organization}
                    organizations={organizations}
                    onChange={(org: Organization) => setOrganization(org)}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    mode={mode}
                /> */}
            <Box>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                </Routes>
            </Box>
            {/* </ThemeProvider> */}
        </>
    );
}