import { Button, Paper, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useEffect, useState } from "react";
import { useTranslate } from "react-polyglot";
import { useParams, useNavigate } from "react-router";
import dayjs from "dayjs";
import FileCopy from "@mui/icons-material/FileCopy";
import MapRounded from "@mui/icons-material/MapRounded";

import Loading from "../../Components/Common/Loading";
import { SavingState } from "../../Components/Common/SavingState";
import { ListOfUserProfiles, Organization, Trip, ListOfOrganizationUserProfiles, UserProfile, Client } from "../../core/apiClient";
import { _OrganizationsApi, _TripsApi, _UserprofilesApi } from "../../core/getIt";
import TripForm from "./TripForm";
import { SavingState as PartialFormSavingState } from "../../core/hooks"
import { useSnackbar } from "notistack";
import { pick } from "lodash";

var objectSupport = require("dayjs/plugin/objectSupport");
dayjs.extend(objectSupport);


export default function ShowTrip(props: any) {
    const [trip, setTrip] = useState<Trip>();
    const [client, setClient] = useState<Client>();
    const [organization, setOrganization] = useState<Organization>();
    const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const params = useParams();
    const [savingState, setSavingState] = useState<PartialFormSavingState>("NONE");
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const t = useTranslate();
    function getClientName() {
        if (client) {
            return [client.firstName, client.lastName].filter(n => !!n).join(" ")
        }
        return "";
    }

    const loadData = async () => {
        setOrganization(
            await new Promise((resolve, reject) =>
                _OrganizationsApi().retrieveOrganization(params.organizationId as string)
                    .then(resolve)
                    .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
            )
        );
        setTrip(
            await new Promise((resolve, reject) =>
                _TripsApi().retrieveTrip(params.tripId as string)
                    .then(resolve)
                    .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
            )
        )
        const organizationUserProfiles: ListOfOrganizationUserProfiles = await new Promise((resolve, reject) =>
            _OrganizationsApi().listOrganizationUserProfiles(params.organizationId)
                .then(resolve)
                .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
        )
        const listOfUserProfiles: ListOfUserProfiles = await new Promise((resolve, reject) =>
            _UserprofilesApi().listUserProfiles(JSON.stringify({ ids: organizationUserProfiles.records.map(r => r.userProfileId) }), "[]", "{}")
                .then(resolve)
                .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
        )
        setUserProfiles(listOfUserProfiles.records || []);
    };

    useEffect(() => {
        if (params.organizationId && params.tripId) {
            loadData();
        }
    }, [params])

    useEffect(() => {
        if (trip) {
            new Promise((resolve, reject) =>
                _OrganizationsApi().retrieveClient(trip.client.id, trip.organizationId)
                    .then(setClient)
                    .then(resolve)
                    .catch(reject)
            )
        }
    }, [trip])

    useEffect(() => {
        if (client && trip && userProfiles && organization) {
            setLoading(false);
        }
    }, [client, trip, userProfiles, organization])


    if (loading) {
        return <Loading />;
    }
    function TripButtonsComponent(props: any) {
        return <Box sx={{ float: "right" }}>
            <Button onClick={
                () => navigate(`/organizations/${organization.id}/trips/create`, {
                    state: {
                        record: pick(
                            trip, [
                                "organizationId", 
                                "userProfileId",
                                "client",
                                "address",
                                "location",
                                "tripType",
                                "options"
                            ]
                        )
                    }
                })
            }
                variant="text"
                startIcon={<FileCopy />}>
                {t("app.trips.copy_trip")}
            </Button>
            <Button target="_blank" href={`/track/${trip.id}`} variant="text" startIcon={<MapRounded />}>
                {t("app.trips.track_trip")}
            </Button>
        </Box>
    }
    return (
        <Box>
            <Box m={2}>
                <TripButtonsComponent />
                <Typography variant="h6">{t("app.menu.trip")} - {getClientName()}</Typography>
            </Box>
            <TripForm
                clients={[client]}
                trip={trip}
                userProfiles={userProfiles}
                organization={organization}
                onSavingStateChange={setSavingState}
                action={(record: Trip) => _TripsApi().updateTrip(record, record.id)}
                footer={
                    <Box m={2}><SavingState savingState={savingState} /></Box>
                }
            />
        </Box>
    )
}