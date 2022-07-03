import React, { useState, useEffect } from "react";
import { useTranslate } from "react-polyglot";
import firebase from "firebase";
import { Stepper, Step, StepLabel, Typography, Dialog, AppBar, Toolbar, IconButton, Button } from "@mui/material";
import { Box } from "@mui/system";
import { useNavigate } from "react-router";
import DoneIcon from "@mui/icons-material/Done";
import CircleIcon from "@mui/icons-material/Circle";
import CloseIcon from "@mui/icons-material/Close";

import { UserProfile, UserProfileOrganization } from "../core/apiClient";
import { _UserprofilesApi, _OrganizationsApi } from "../core/getIt";
import Loading from "../Components/Common/Loading";
import { getLoggingInstance } from "../core/utils/logger";
import { useSnackbar } from "notistack";

type GetStartedStep = {
    label: string,
    enabled: boolean,
    completed: boolean,
    onClick: () => Promise<any>
}

type LoadingState = {
    userProfile?: boolean;
    organization?: boolean;
    invitations?: boolean;
    clients?: boolean;
    trips?: boolean;
}

type DialogState = {
    termsAndConditions: boolean,
    privacyPolicy: boolean
}

export default function HomePage(props: any) {
    const [authUser, setAuthUser] = useState<any>();
    const t = useTranslate();
    const navigate = useNavigate();
    const [userGetStartedSteps, setUserGetStartedSteps] = useState<GetStartedStep[]>([]);
    const [organizationGetStartedSteps, setOrganizationGetStartedSteps] = useState<GetStartedStep[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile>();
    const [showOrganizationGetStarted, setShowOrganizationGetStarted] = useState(false);
    const [adminOrganizationId, setAdminOrganizationId] = useState<string>(null as any);
    const [hasInvitations, setHasInvitations] = useState(false);
    const [hasClients, setHasClients] = useState(false);
    const [hasTrips, setHasTrips] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const [loadingState, setLoadingState] = useState<LoadingState>({
        userProfile: true, organization: true, clients: true, invitations: true, trips: true
    });
    const [verifyEmailSent, setVerifyEmailSent] = useState(false)
    const [loading, setLoading] = useState<boolean>(true);
    const [dialogState, setDialogState] = useState<DialogState>({
        termsAndConditions: false, privacyPolicy: false
    });
    const logger = getLoggingInstance(HomePage.name);
    logger.trace("details", { authUser, loadingState, loading });

    useEffect(() => {
        setAuthUser(firebase.auth().currentUser)
    }, [])

    useEffect(() => {
        if (authUser) {
            _UserprofilesApi().retrieveUserProfile(authUser.uid)
                .then(data => setUserProfile(data))
                .catch(resp => resp.json().then(data => logger.error("error", { data })))
                .finally(() => {
                    setLoadingState({ ...loadingState, userProfile: false });
                    _UserprofilesApi().listUserProfileOrganizations(authUser.uid)
                        .then(orgs => {
                            const adminOrg = orgs.find(o => o.role === UserProfileOrganization.RoleEnum.ADMIN);
                            setAdminOrganizationId(adminOrg?.organizationId as any);
                            setShowOrganizationGetStarted(orgs.length === 0 || !!adminOrg);
                        })
                        .catch(resp => resp.json().then(data => logger.error("error", { data })))
                        .finally(() => {
                            setLoadingState({ ...loadingState, organization: false, userProfile: false });
                        });
                });
        }
    }, [authUser]);

    useEffect(() => {
        if (!loadingState.userProfile) {
            setUserGetStartedSteps(getStartedStepsUser())
        }
        if (adminOrganizationId) {
            if (!loadingState.userProfile && !loadingState.organization && loadingState.invitations) {
                _OrganizationsApi()
                    .listOrganizationUserProfiles(adminOrganizationId)
                    .then(users => {
                        setHasInvitations((users.total || 0) > 1)
                    })
                    .catch(resp => { resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
                    .finally(() => {
                        setLoadingState({ ...loadingState, organization: false, userProfile: false, invitations: false })
                    });
            }
            if (!loadingState.invitations && loadingState.clients) {
                _OrganizationsApi()
                    .listClients(adminOrganizationId)
                    .then(clients => setHasClients((clients.total || 0) > 0))
                    .catch(resp => { resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
                    .finally(() => setLoadingState({ ...loadingState, organization: false, userProfile: false, clients: false, invitations: false }));
            }
            if (!loadingState.clients && loadingState.trips) {
                _OrganizationsApi().listTrips(adminOrganizationId, null)
                    .then(trips => setHasTrips((trips.total || 0) > 0))
                    .catch(resp => { resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
                    .finally(() => setLoadingState({} as any));
            }
            if (!loadingState.trips) {
                setOrganizationGetStartedSteps(getStartedStepsOrganization());
            }
        }
        else if (adminOrganizationId === undefined && !organizationGetStartedSteps.length) {
            setLoadingState({} as any);
            setOrganizationGetStartedSteps(getStartedStepsOrganization());
        }
        setLoading(loadingState.userProfile as any || loadingState.organization as any);
    }, [loadingState]);

    useEffect(() => {
        if (authUser)
            setUserGetStartedSteps(getStartedStepsUser())
    }, [verifyEmailSent, authUser])

    function getStartedStepsUser(): GetStartedStep[] {
        return [
            // {
            //     label: 'app.home.let_us_know_who_you_are',
            //     enabled: true,
            //     completed: !!userProfile,
            //     onClick: () => {
            //         return Promise.resolve(navigate("/userprofiles/create"));
            //     }
            // },
            {
                label: 'app.home.verify_your_email',
                enabled: !authUser!.emailVerified && !verifyEmailSent,
                completed: authUser!.emailVerified,
                onClick: () => {
                    if (firebase.auth().currentUser) {
                        enqueueSnackbar(t("app.home.verification_email_sent"), { persist: true });
                        setVerifyEmailSent(true);
                        return firebase.auth().currentUser?.sendEmailVerification() as any;
                    }
                    else
                        return Promise.resolve();
                }
            },
            {
                label: 'app.home.review_terms_and_conditions',
                enabled: true,
                completed: false,
                onClick: () => {
                    setDialogState({ ...dialogState, termsAndConditions: true })
                    return Promise.resolve();
                }
            },
            {
                label: 'app.home.review_privacy_policy',
                enabled: true,
                completed: false,
                onClick: () => {
                    setDialogState({ ...dialogState, privacyPolicy: true });
                    return Promise.resolve()
                }
            },
        ]
    }
    function getStartedStepsOrganization(): GetStartedStep[] {
        //! Should also include terms/privacy agree
        const enableCreateOrganization = (authUser && authUser.emailVerified && !!userProfile) || false;
        return [
            {
                label: 'app.home.create_your_organization',
                enabled: enableCreateOrganization,
                completed: !!adminOrganizationId,
                onClick: () => {
                    return Promise.resolve(navigate("/organizations/create"));
                }
            },
            {
                label: 'app.home.invite_your_first_driver',
                enabled: !hasInvitations && !!adminOrganizationId,
                completed: hasInvitations,
                onClick: () => {
                    return Promise.resolve(navigate(`/organizations/${adminOrganizationId}/invitations`));
                }
            },
            {
                label: 'app.home.set_up_your_first_client',
                enabled: enableCreateOrganization && hasInvitations && !hasClients,
                completed: hasClients,
                onClick: () => {
                    return Promise.resolve({});
                    // return Promise.resolve(navigate(`/clients/create`, {
                    //     record: { organizationId: adminOrganizationId }
                    // }));
                }
            },
            {
                label: 'app.home.schedule_your_first_trip',
                enabled: enableCreateOrganization && hasInvitations && hasClients && !hasTrips,
                completed: hasTrips,
                onClick: () => {
                    return Promise.resolve({});
                    // return Promise.resolve(navigate(`/trips/create`, {
                    //     record: { organizationId: adminOrganizationId }
                    // }));
                }
            },
        ]
    }
    function StepperComponent({ steps }) {
        return (<Stepper orientation="vertical">
            {steps.map((step, index) => (
                <Step key={step.label}>
                    <StepLabel
                        style={{
                            cursor: step.completed || !step.enabled ? "auto" : "pointer"
                        }}
                        icon={step.completed ? <DoneIcon /> : <CircleIcon color="disabled" />}
                    >
                        <Typography
                            onClick={() => {
                                if (!step.completed && step.enabled) { step.onClick() }
                            }}
                            style={{
                                color: (step.completed || !step.enabled) ? "gray" : `primary`,
                                textDecoration: step.completed ? "line-through" : "inherit"
                            }}
                            variant="subtitle1">
                            {t(step.label)}
                        </Typography>
                    </StepLabel>
                </Step>
            ))}
        </Stepper>);
    }

    function PolicyDialog({ src, open, onClose, onClick }) {
        return (
            <Dialog onClose={onClose} fullScreen={true} open={open}>
                <AppBar color="secondary">
                    <Toolbar>
                        <IconButton edge="start" color="inherit" aria-label="close" onClick={onClose}>
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h6" style={{ flex: 1 }}>
                            {/* {t("app.common.messages.terms_and_conditions")} */}
                        </Typography>
                        <Button color="inherit" onClick={onClick}>
                            {t("app.common.messages.accept")}
                        </Button>
                    </Toolbar>
                </AppBar>
                <iframe title="Terms" style={{ marginTop: -50, height: "100%", width: "100%", position: "absolute" }} src={src} />
            </Dialog>
        )
    }

    if (loading) {
        return (
            <>
                <Loading />
            </>
        );
    }

    return (
        <Box m={2}>
            <Typography variant="h5">{t("app.home.welcome")}</Typography>
            <Box>
                <Typography variant="subtitle1">{t("app.home.set_up_your_account")}</Typography>
                <StepperComponent steps={userGetStartedSteps} />
                <PolicyDialog
                    open={dialogState.termsAndConditions}
                    onClick={() => { setDialogState({ ...dialogState, termsAndConditions: false }) }}
                    onClose={() => setDialogState({ ...dialogState, termsAndConditions: false })}
                    src={`${process.env.REACT_APP_FLEET_ON_ROUTE_URL}/terms-and-conditions`}
                />
                <PolicyDialog
                    open={dialogState.privacyPolicy}
                    onClick={() => { setDialogState({ ...dialogState, privacyPolicy: false }) }}
                    onClose={() => setDialogState({ ...dialogState, privacyPolicy: false })}
                    src={`${process.env.REACT_APP_FLEET_ON_ROUTE_URL}/privacy-policy`}
                />
            </Box>
            {
                showOrganizationGetStarted && !loadingState.trips &&
                <Box>
                    <Typography variant="subtitle1">{t("app.home.set_up_your_organization")}</Typography>
                    <StepperComponent steps={organizationGetStartedSteps} />
                </Box>
            }
        </Box>
    )
}
