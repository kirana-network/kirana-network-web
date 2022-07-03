import { Button, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useSnackbar } from "notistack";
import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Loading from "../../Components/Common/Loading";
import { Trip, Client, Organization, UserProfile, ListOfOrganizationUserProfiles, ListOfUserProfiles, ListOfClients } from "../../core/apiClient";
import { _OrganizationsApi, _TripsApi, _UserprofilesApi } from "../../core/getIt";
import { useTranslate } from "react-polyglot";
import TripForm from "./TripForm";

export default function CreateTrip(props: any) {
    const [trip, setTrip] = useState<Trip>();
    const [organization, setOrganization] = useState<Organization>();
    const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<Client[]>();
    const params = useParams();
    const location = useLocation();
    const [record, setRecord] = useState<Trip>();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const t = useTranslate();
    const loadData = async () => {
        setOrganization(
            await new Promise((resolve, reject) =>
                _OrganizationsApi().retrieveOrganization(params.organizationId as string)
                    .then(resolve)
                    .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
            )
        );
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

    const loadClients = async () => {
        const _clients: ListOfClients = await new Promise((resolve, reject) => _OrganizationsApi().listClients(params.organizationId).then(resolve)
            .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) }));
        setClients(_clients.records);
    }

    useEffect(() => {
        if (params.organizationId) {
            loadData();
            loadClients();
        }
    }, [params]);

    useEffect(() => {
        if (location && location.state) {
            setTrip(location.state.record);
        }
        else {
            setTrip(
                {
                    organizationId: params.organizationId,
                    tripStatus: Trip.TripStatusEnum.PENDING,
                    tripType: Trip.TripTypeEnum.DELIVERY,
                } as any
            );
        }
    }, [location]);

    useEffect(() => {
        if (trip && userProfiles && organization && clients) {
            setRecord(trip);
            setLoading(false);
        }
    }, [trip, userProfiles, organization, clients])


    if (loading) {
        return <Loading />;
    }

    const create = () => _TripsApi().createTrip(record)
        .then(result => navigate(`/organizations/${record.organizationId}/trips/${result.id}`))
        .catch(resp => resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })))

    return (
        <>
            <Box m={2}>
                <Typography variant="h6">{t("app.organizations.create_trip")}</Typography>
            </Box>
            <TripForm
                trip={trip}
                clients={clients}
                userProfiles={userProfiles}
                organization={organization}
                formWaitDuration={25}
                action={(_record: Trip) => {
                    setRecord(_record);
                    return Promise.resolve(_record);
                }}
                onSavingStateChange={() => { }}
                footer={
                    <Box m={2}><Button onClick={create}>Save</Button></Box>
                }
            />
        </>

    )
}