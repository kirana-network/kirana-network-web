import { Paper, Button, Tab, Tabs, Typography } from "@mui/material";
import { Box } from "@mui/system";
import dayjs from "dayjs";
import { uniq } from "lodash";
import { useEffect, useState } from "react";
import { useTranslate } from "react-polyglot";
import { Route, Routes, useLocation, useNavigate, useParams } from "react-router";
import { Link } from "react-router-dom";
import DataTable from "../../Components/Common/DataTable";
import Loading from "../../Components/Common/Loading";
import PlainLink from "../../Components/Common/PlainLink";
import { SavingState } from "../../Components/Common/SavingState";
import { Client, ListOfTrips, ListOfUserProfiles, TripClient, UserProfile } from "../../core/apiClient";
import { _OrganizationsApi, _UserprofilesApi } from "../../core/getIt";
import { SavingState as PartialRecordSavingState } from "../../core/hooks";
import { getLoggingInstance } from "../../core/utils/logger";
import ClientForm from "./ClientForm";
import { useSnackbar } from "notistack";

export default function ClientRoute(props: any) {
    const navigate = useNavigate();
    const t = useTranslate();
    const location = useLocation();
    const params = useParams();
    const logger = getLoggingInstance(ClientRoute.name);
    const [client, setClient] = useState<Client>();
    const { enqueueSnackbar } = useSnackbar();
    const loadData = () => {
        const { clientId, organizationId } = params;
        _OrganizationsApi().retrieveClient(clientId!, organizationId!)
            .then(setClient)
            .catch(response => {
                response.json().then(data => enqueueSnackbar(data.message, { variant: "error" }));
            })
    }

    useEffect(() => {
        if (params.clientId && params.organizationId) {
            loadData();
        }
    }, [params]);

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
                <Tabs value={location.pathname.split("/").reverse()[0]} onChange={(_, value) => navigate(value)}>
                    <Tab value={`details`} label={t("app.clients.details")} />
                    <Tab value={`trips`} label={t("app.clients.trips")} />
                </Tabs>
            </Box>
            <Routes>
                <Route path="details" element={<ShowClient {...props} record={client} />} />
                <Route path="trips" element={<ListClientTrips {...props} />} />
            </Routes>
        </Box>
    );
}

export function ShowClient(props: any) {
    const [savingState, setSavingState] = useState<PartialRecordSavingState>("NONE");
    const params = useParams();
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
    const params = useParams();
    const logger = getLoggingInstance(ListClientTrips.name);
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const navigateToCreateTrip = () => {
        _OrganizationsApi().retrieveClient(params.clientId, params.organizationId)
            .then(client => {
                navigate(`/organizations/${params.organizationId}/trips/create`, { state: { record: { client, organizationId: params.organizationId } } })
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
                    <PlainLink to={`/organizations/${r.organizationId}/trips/${r.id}`}><strong>{r.address}</strong></PlainLink>,
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