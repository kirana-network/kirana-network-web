import { Paper, Button, Tab, Tabs, Typography, Box } from "@mui/material";
import dayjs from "dayjs";
import { uniq } from "lodash";
import { useEffect, useState } from "react";
import { useTranslate } from "react-polyglot";
import { useSnackbar } from "notistack";
import { useRouter } from "next/router";
import DataTable from "../../../../../components/Common/DataTable";
import Loading from "../../../../../components/Common/Loading";
import PlainLink from "../../../../../components/Common/PlainLink";
import { Client, UserProfile, TripClient } from "../../../../../core/apiClient";
import { registerDependencies, _OrganizationsApi, _UserprofilesApi } from "../../../../../core/getIt";
import { getLoggingInstance } from "../../../../../core/utils/logger";
import firebase from "firebase";
import { attachCredentialsToApiClient, initializeFirebaseApp } from "../../../../../core/utils/auth";
import { SavingState as PartialRecordSavingState } from "../../../../../core/hooks";
import { SavingState } from "../../../../../components/Common/SavingState";
import ClientForm from "../../../../../components/forms/clients/ClientForm";

initializeFirebaseApp();
registerDependencies();

export default function OrganizationClientPage(props: any) {
    const router = useRouter();
    const t = useTranslate();
    const params = router.query;
    const logger = getLoggingInstance(OrganizationClientPage.name);
    const [client, setClient] = useState<Client>();
    const { enqueueSnackbar } = useSnackbar();
    const [authUser, setAuthUser] = useState<firebase.User>();
    const loadData = () => {
        const { clientId, organizationId } = params;
        _OrganizationsApi().retrieveClient(clientId! as any, organizationId! as any)
            .then(setClient)
            .catch(response => {
                response.json().then(data => enqueueSnackbar(data.message, { variant: "error" }));
            })
    }

    useEffect(() => {
        if (authUser && params.clientId && params.organizationId) {
            loadData();
        }
    }, [params, authUser]);

    useEffect(() => {
        firebase.auth().onAuthStateChanged(async user => {
            attachCredentialsToApiClient(await user.getIdToken());
            setAuthUser(user);
        });
    }, []);

    function getClientName() {
        if (client) {
            return [client.firstName, client.lastName].filter(n => !!n).join(" ")
        }
        return "";
    }

    return (
        <Box sx={{ width: '100%', paddingTop: 2 }}>
            <Box m={2}>
                <Typography variant="h6">{t("app.organizations.client")} - {getClientName()}</Typography>
            </Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                {/* <Tabs value={location.pathname.split("/").reverse()[0]} onChange={(_, value) => router.push(value)}>
                    <Tab value={`details`} label={t("app.clients.details")} />
                    <Tab value={`trips`} label={t("app.clients.trips")} />
                </Tabs> */}
            </Box>
            {/* <Routes>
                <Route path="details" element={<ShowClient {...props} record={client} />} />
                <Route path="trips" element={<ListClientTrips {...props} />} />
            </Routes> */}
        </Box>
    );
}

export function ShowClient(props: any) {
    const [savingState, setSavingState] = useState<PartialRecordSavingState>("NONE");
    const [loading, setLoading] = useState(true);
    const { record } = props;

    useEffect(() => {
        setLoading(!record)
    }, [record])

    if (loading) {
        return <Loading />
    }
    return (
        <ClientForm
            client={record}
            action={(record: Client) => _OrganizationsApi().updateClient(record, record.id, record.organizationId)}
            onSavingStateChange={setSavingState}
            footer={<Box m={2}><SavingState savingState={savingState} /></Box>}
        />
    )
}

type TripRow = {
    id: string;
    address: string;
    driver?: UserProfile;
    client?: TripClient;
    scheduledAt: string;
    organizationId: string;
}

function ListClientTrips(props: any) {
    const t = useTranslate();
    const [rows, setRows] = useState<TripRow[]>([]);
    const [loading, setLoading] = useState(true);
    const logger = getLoggingInstance(ListClientTrips.name);
    const router = useRouter();
    const params = router.query as { clientId: string, organizationId: string };
    const { enqueueSnackbar } = useSnackbar();

    const navigateToCreateTrip = () => {
        _OrganizationsApi().retrieveClient(params.clientId, params.organizationId)
            .then(client => {
                router.push({
                    pathname: `/portal/organizations/${params.organizationId}/trips/create`,
                    query: {
                        organizationId: params.organizationId, clientId: params.clientId
                    }
                })
            });
    }

    const loadData = () => {
        const _catch = (response: Response) => {
            response.json().then(data => {
                enqueueSnackbar(data.message || data.type, { variant: "error" });
            });
        }

        _OrganizationsApi()
            .listTrips(params.organizationId as string, params.clientId)
            .then(listOfTrips => {
                _UserprofilesApi().listUserProfiles(JSON.stringify({ ids: uniq(listOfTrips.records?.map(t => t.userProfileId)) }), "[]", "{}")
                    .then(userProfiles => {
                        setRows(listOfTrips.records?.map(r => ({
                            address: r.address,
                            id: r.id,
                            client: r.client,
                            driver: userProfiles.records?.find(u => u.id == r.userProfileId),
                            scheduledAt: dayjs(r.scheduledAt as any).format("YYYY-MM-DD"),
                            organizationId: r.organizationId,
                        })) as any)
                        setLoading(false);
                    }).catch(_catch);
            })
            .catch(_catch);
    }
    useEffect(() => {
        if (params.organizationId && params.clientId) {
            loadData();
        }
    }, [params]);

    if (loading) {
        return <Loading />
    }

    return (
        <>
            <DataTable
                headers={[t("app.organizations.address"), t("app.trips.scheduledAt"), t("app.organizations.client"), t("app.organizations.driver"), ""]}
                rows={rows.map(r => [
                    <PlainLink to={`/portal/organizations/${r.organizationId}/trips/${r.id}`}><strong>{r.address}</strong></PlainLink>,
                    r.scheduledAt,
                    [r.client?.firstName, r.client?.lastName].filter(n => !!n).join(" "),
                    [r.driver?.firstName, r.driver?.lastName].filter(n => !!n).join(" "),
                ])}
                empty={
                    <>
                        {t("app.organizations.no_trips")}
                        <Button onClick={navigateToCreateTrip}>{t("app.organizations.create_trip")}</Button>
                    </>
                }
            />
        </>
    )
}