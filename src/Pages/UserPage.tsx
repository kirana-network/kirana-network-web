import { Box, Tabs, Tab, Paper, TextField, IconButton, Tooltip, Button, Link, Typography, CardContent, Card, Grid } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslate } from "react-polyglot";
import { useParams, useNavigate, useLocation, Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import DataTable from "../Components/Common/DataTable";
import Loading from "../Components/Common/Loading";
import PlainLink from "../Components/Common/PlainLink";
import { SavingState } from "../Components/Common/SavingState";
import { CustomerProfile, Invitation, ListOfCustomerProfiles, ListOfOrganizations, Organization, SetupCustomerProfileResponse, UserProfile, UserProfileOrganization } from "../core/apiClient";
import { _OrganizationsApi, _UserprofilesApi } from "../core/getIt";
import { usePartialAutoUpdateForm } from "../core/hooks";
import { getLoggingInstance } from "../core/utils/logger";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import { useSnackbar } from "notistack";
import { DeleteUserAccount } from "../Components/DeleteUserAccount";

export default function UserPage(props: any) {
    const t = useTranslate();
    const logger = getLoggingInstance(UserPage.name);
    const navigate = useNavigate();
    const location = useLocation();
    const [userProfile, setUserProfile] = useState<UserProfile>();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const { enqueueSnackbar } = useSnackbar();
    useEffect(() => {
        if (params.id) {
            _UserprofilesApi().retrieveUserProfile(params.id)
                .then(setUserProfile)
                .catch(resp => resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })));
        }
    }, [params, params.id]);
    useEffect(() => {
        if (userProfile) {
            setLoading(false);
        }
    }, [userProfile]);

    if (loading) {
        return <Loading />
    }
    return (
        <Box sx={{ width: '100%' }}>
            <Box m={2}>
                <Typography variant="h6">{t("app.menu.user_account")}</Typography>
            </Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={location.pathname.split("/").reverse()[0]} onChange={(_, value) => navigate(value)}>
                    <Tab value="details" label={t("app.userprofiles.profile")} />
                    <Tab value="organizations" label={t("app.userprofiles.organizations")} />
                    <Tab value="invitations" label={t("app.userprofiles.invitations")} />
                    <Tab value="payments" label={t("app.userprofiles.payments")} />
                </Tabs>
            </Box>
            <Box sx={{ paddingTop: 2 }}>
                <Routes>
                    <Route path="details" element={<UserProfileForm record={userProfile} />} />
                    <Route path="organizations" element={<UserProfileOrganizationsForm record={userProfile} />} />
                    <Route path="invitations" element={<UserProfileInvitationsForm record={userProfile} />} />
                    <Route path="payments" element={<UserCustomerProfileForm record={userProfile} />} />
                    <Route path="*" element={<Navigate to={"details"} />} />
                </Routes>
            </Box>
        </Box>
    );
}

function UserProfileForm(props: any) {
    const t = useTranslate();
    const { enqueueSnackbar } = useSnackbar();
    const partialForm = usePartialAutoUpdateForm({
        record: props && (props.record as UserProfile || {} as UserProfile),
        action: (record: UserProfile) => {
            return _UserprofilesApi().updateUserProfile(record, record.id);
        },
        _then: (record) => { },
        _catch: (response) => {
            response.json().then(data => enqueueSnackbar(data.message, { variant: "error" }));
        },
        _finally: () => { },
        fields: ["firstName", "lastName", "id"]
    })
    return (
        <>
            <Box m={2}>
                <TextField
                    variant="standard"
                    label={t("app.login.first_name")}
                    value={partialForm.partialRecord.firstName}
                    onChange={(event) => partialForm.setPartialRecord({
                        ...partialForm.partialRecord,
                        firstName: event.target.value
                    })}
                />
            </Box>
            <Box m={2}>
                <TextField
                    variant="standard"
                    label={t("app.login.last_name")}
                    value={partialForm.partialRecord.lastName}
                    onChange={(event) => partialForm.setPartialRecord({
                        ...partialForm.partialRecord,
                        lastName: event.target.value
                    })}
                />
            </Box>
            <Box m={2}>
                <TextField
                    variant="standard"
                    disabled
                    label={t("app.clients.email")}
                    defaultValue={props.record.email}
                />
            </Box>
            <Box m={2}>
                <SavingState savingState={partialForm.savingState} />
            </Box>
            <Box m={2}>
                <DeleteUserAccount userProfileId={props.record.id} />
            </Box>
        </>
    );
}

function UserProfileOrganizationsForm(props: any) {
    const [loading, setLoading] = useState(true);
    const t = useTranslate();
    const { record } = props;
    const [rows, setRows] = useState([]);
    const { enqueueSnackbar } = useSnackbar();
    const loadData = async () => {
        const userProfileOrganizations: UserProfileOrganization[] = await new Promise((resolve, reject) =>
            _UserprofilesApi()
                .listUserProfileOrganizations(record.id)
                .then(resolve)
                .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
        )
        const organizationIds = userProfileOrganizations.map(u => u.organizationId);
        const listOfOrganizations: ListOfOrganizations = await new Promise((resolve, reject) =>
            _OrganizationsApi().listOrganizations("{}", "[]", JSON.stringify({ ids: organizationIds }))
                .then(resolve)
                .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
        )
        setRows(
            listOfOrganizations.records.map(organization => [
                <PlainLink to={`/organizations/${organization.id}`}><b>{organization.name}</b></PlainLink>,
                userProfileOrganizations.find(u => u.organizationId === organization.id).role,
                userProfileOrganizations.find(u => u.organizationId === organization.id).status,
            ])
        )
        setLoading(false);
    }

    useEffect(() => {
        if (record) {
            loadData();
        }
    }, [record]);

    if (loading) {
        return <Loading />
    }
    return (
        <DataTable
            headers={[t("app.menu.organization"), t("app.organizations.role"), t("app.organizations.status")]}
            rows={rows}
            empty={t("")}
        />
    )
}

function UserProfileInvitationsForm(props: any) {
    const [loading, setLoading] = useState(true);
    const t = useTranslate();
    const { record } = props;
    const [rows, setRows] = useState([]);
    const { enqueueSnackbar } = useSnackbar();

    const updateInvitation = (invitation: Invitation, newStatus: Invitation.StatusEnum) => {
        _UserprofilesApi()
            .updateInvitation({
                status: newStatus
            }, invitation.organizationId, props.record.id)
            .then(() => {
                loadData()
            })
            .catch(resp => { resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
    }
    const ButtonsField = (props: any) => {
        if (props.record.status === Invitation.StatusEnum.ACCEPTED) {
            return <></>
        }
        return (
            <>
                <AcceptButton {...props} />
                <RejectButton {...props} />
            </>
        );
    }

    const RejectButton = (props: any) => {
        return (
            <Tooltip title={t("app.common.reject")}>
                <IconButton size="small" color="error" onClick={() => updateInvitation(props.record, Invitation.StatusEnum.DECLINED)}><CloseIcon /></IconButton>
            </Tooltip>
        );
    }
    const AcceptButton = (props: any) => {
        return (
            <Tooltip title={t("app.common.accept")}>
                <IconButton size="small" color="primary" onClick={() => updateInvitation(props.record, Invitation.StatusEnum.ACCEPTED)}><CheckIcon /></IconButton>
            </Tooltip>
        );
    }

    const loadData = async () => {
        const invitations: Invitation[] = await new Promise((resolve, reject) =>
            _UserprofilesApi()
                .listInvitations(record.id)
                .then(resolve)
                .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
        )
        const organizationIds = invitations.map(u => u.organizationId);
        const listOfOrganizations: ListOfOrganizations = await new Promise((resolve, reject) =>
            _OrganizationsApi().listOrganizations("{}", "[]", JSON.stringify({ ids: organizationIds }))
                .then(resolve)
                .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
        )
        setRows(
            listOfOrganizations.records.map(organization => [
                organization.name,
                invitations.find(u => u.organizationId === organization.id).status,
                <ButtonsField record={invitations.find(u => u.organizationId === organization.id)} />
            ])
        )
        setLoading(false);
    }
    useEffect(() => {
        if (record) {
            loadData();
        }
    }, [record]);

    if (loading) {
        return <Loading />
    }
    return (
        <DataTable
            headers={[t("app.menu.organization"), t("app.organizations.status"), ""]}
            rows={rows}
            empty={t("app.userprofiles.no_invitations")}
        />
    )
}

function UserCustomerProfileForm(props: any) {
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(false);
    const t = useTranslate();
    const { record } = props;
    const [rows, setRows] = useState([]);
    const { enqueueSnackbar } = useSnackbar();
    function getDetails(p: CustomerProfile) {
        switch (p.type) {
            case CustomerProfile.TypeEnum.STRIPE:
                return `${p.stripe.card.brand.toLocaleUpperCase()} **** **** **** ${p.stripe.card.last4}`
            case CustomerProfile.TypeEnum.OFFLINE:
                return p.offline?.notes;
            default: return ""
        }
    }

    function cancelSubscription(customerProfile: CustomerProfile) {
        _UserprofilesApi()
            .deleteCustomerProfile(customerProfile.id, customerProfile.userProfileId)
            .then(() => {
                enqueueSnackbar(t("app.userprofiles.subscription_cancelled_message"), { variant: "info" });
                loadData();
            })
            .catch(resp => { resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) });
    }

    const IconButtons = (props: any) => {
        const { record: profile } = props
        if (profile.type == CustomerProfile.TypeEnum.OFFLINE) {
            return <></>;
        }
        return (
            <Tooltip title={t("app.userprofiles.cancel_subscription")}>
                <IconButton
                    size={"small"}
                    onClick={(e) => {
                        cancelSubscription(profile);
                        e.stopPropagation();
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Tooltip>
        );
    }
    const loadData = async () => {
        const customerProfiles: ListOfCustomerProfiles = await new Promise((resolve, reject) => _UserprofilesApi().listCustomerProfiles(record.id).then(resolve)
            .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) }));
        setRows(
            customerProfiles.records.map(c => [
                c.type,
                getDetails(c),
                <IconButtons record={c} />
            ])
        )
        setLoading(false);
    }
    async function setupCustomerProfile(blockchainService: boolean) {
        setProgress(true);
        const response: SetupCustomerProfileResponse = await new Promise((resolve, reject) => _UserprofilesApi().setupCustomerProfile({
            type: CustomerProfile.TypeEnum.STRIPE,
            userProfileId: record.id,
            blockchainService
        }, record.id).then(resolve).catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) }));
        if (response.url) {
            window.location.href = response.url;
        }
    }

    useEffect(() => {
        if (record) {
            loadData();
        }
    }, [record]);

    if (loading) {
        return <Loading />
    }
    return (
        <DataTable
            headers={[t("app.userprofiles.subscription_type"), t("app.organizations.status"), ""]}
            rows={rows}
            empty={
                <Box>
                    {t("app.userprofiles.no_subscriptions")}
                    <Grid container spacing={8} px={8}>
                        <Grid item xs={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h5">Standard Service</Typography>
                                    <Button disabled={progress} onClick={() => setupCustomerProfile(false)}>{t("app.userprofiles.create_subscription")}</Button>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h5">Blockchain Service</Typography>
                                    <Button disabled={progress} onClick={() => setupCustomerProfile(true)}>{t("app.userprofiles.create_subscription")}</Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            }
        />
    )
}