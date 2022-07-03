import { Typography, Box, Button, Stack, Popover, IconButton } from "@mui/material";
import dayjs from "dayjs";
import _, { uniq } from "lodash";
import { useSnackbar } from "notistack";
import { useState, useEffect, useMemo } from "react";
import { useTranslate } from "react-polyglot";
import { useNavigate } from "react-router-dom";
import DataGrid from "../../Components/Common/DataGrid/DataGrid";
import Loading from "../../Components/Common/Loading";
import { UserProfile, TripClient, ListOfTrips, ListOfUserProfiles, Trip } from "../../core/apiClient";
import { _OrganizationsApi, _UserprofilesApi } from "../../core/getIt";
import { DateRangePicker, Range } from 'react-date-range';
import CalendarToday from "@mui/icons-material/CalendarToday";
import Close from "@mui/icons-material/Close";
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { DropdownColumnFilter, DropdownColumnFilterFn } from "../../Components/Common/DataGrid/Filters/DropdownColumnFilter";
import { getLoggingInstance } from "../../core/utils/logger";
import { DateRangeColumnFilter, DateRangeColumnFilterFn } from "../../Components/Common/DataGrid/Filters/DateRangeColumnFilter";
import PlainLink from "../../Components/Common/PlainLink";

const logger = getLoggingInstance(ListOrganizationTrips.name);

type TripRow = {
    id: string;
    address: string;
    driver?: UserProfile;
    client?: TripClient;
    scheduledAt: string;
    organizationId: string;
    tripStatus: Trip.TripStatusEnum;
}

export default function ListOrganizationTrips(props: any) {
    const { record } = props;
    const t = useTranslate();
    const [rows, setRows] = useState<TripRow[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    // const [userProfileId, setUserProfileId] = useState<string>();
    const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
    // const [dateRange, setDateRange] = useState<Range>();
    const loadData = async () => {
        const listOfTrips: ListOfTrips = await new Promise((resolve, reject) =>
            _OrganizationsApi().listTrips(record.id, undefined)
                .then(resolve)
                .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
        );
        const userProfiles: ListOfUserProfiles = await new Promise((resolve, reject) =>
            _UserprofilesApi().listUserProfiles(JSON.stringify({ ids: uniq(listOfTrips.records?.map(t => t.userProfileId)) }), "[]", "{}")
                .then(resolve)
                .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
        );
        setUserProfiles(userProfiles.records || []);
        setTrips(listOfTrips.records);
        setLoading(false);
    }
    useEffect(() => {
        if (record) {
            loadData();
        }
    }, []);

    useEffect(() => {
        setRows(trips
            .map(r => ({
                address: r.address,
                id: r.id,
                client: r.client,
                driver: userProfiles.find(u => u.id == r.userProfileId),
                scheduledAt: r.scheduledAt ? dayjs(r.scheduledAt as any).format("YYYY-MM-DD") : "",
                organizationId: r.organizationId,
                tripStatus: r.tripStatus
            })) as any)
    }, [trips]);

    const columns = useMemo(
        () => [
            {
                Header: t("app.organizations.address"),
                accessor: "address",
                Cell: ({ cell: { value, row: { original: { id, organizationId } } } }) => <PlainLink to={`/organizations/${organizationId}/trips/${id}`}><strong>{value}</strong></PlainLink>,
            },
            {
                Header: t("app.trips.date"),
                accessor: 'scheduledAt',
                Filter: DateRangeColumnFilter,
                filter: DateRangeColumnFilterFn
            },
            {
                Header: t("app.trips.status"),
                accessor: 'tripStatus',
                Filter: DropdownColumnFilter,
                options: [
                    Trip.TripStatusEnum.CANCELLED,
                    Trip.TripStatusEnum.COMPLETED,
                    Trip.TripStatusEnum.ONROUTE,
                    Trip.TripStatusEnum.PENDING,
                    Trip.TripStatusEnum.SCHEDULED
                ].map(v => ({ id: v, label: v })),
                filter: DropdownColumnFilterFn
            },
            {
                Header: t("app.organizations.client"),
                accessor: (r) => [r.client?.firstName, r.client?.lastName].filter(n => !!n).join(" "),
            },
            {
                Header: t("app.organizations.driver"),
                accessor: (r) => [r.driver?.firstName, r.driver?.lastName].filter(n => !!n).join(" "),
                Filter: DropdownColumnFilter,
                options: userProfiles.map(u => ({ id: u.id, label: [u.firstName, u.lastName].filter(n => !!n).join(" ") }))
            },
        ],
        []
    )

    const data = useMemo(
        () => rows,
        [rows]
    );

    if (loading) {
        return <Loading />
    }

    return (
        <>
            <Box m={2}>
                <Button sx={{ float: "right" }} onClick={() => navigate(`/organizations/${record.id}/trips/create`)}>{t("app.organizations.create_trip")}</Button>
                <Typography variant="h6">{t("app.menu.trips")}</Typography>
            </Box>
            <DataGrid data={data} columns={columns} />
        </>
    )
}
