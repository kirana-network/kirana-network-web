import { Box, Button, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { useState, useEffect, useMemo } from "react";
import { useTranslate } from "react-polyglot";
import DataGrid from "../../../../components/Common/DataGrid/DataGrid";
import Loading from "../../../../components/Common/Loading";
import PlainLink from "../../../../components/Common/PlainLink";
import { registerDependencies, _OrganizationsApi } from "../../../../core/getIt";
import { attachCredentialsToApiClient, initializeFirebaseApp } from "../../../../core/utils/auth";
import firebase from "firebase";
import {useRouter} from "next/router";

initializeFirebaseApp();
registerDependencies();

type ClientRow = {
    id: string;
    firstName: string;
    lastName: string;
    cellPhone: string;
    address: string;
    organizationId: string;
    email: string;
}

export default function ListOrganizationClients(props: any) {
    const t = useTranslate();
    const [rows, setRows] = useState<ClientRow[]>([])
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();
    const [authUser, setAuthUser] = useState<firebase.User>();
    const { id } = router.query;
    const loadData = () => {
        _OrganizationsApi()
            .listClients(id as any)
            .then(listOfClients => {
                setRows(
                    (listOfClients?.records || []).map(client => ({
                        address: client.address,
                        cellPhone: client.cellPhone,
                        firstName: client.firstName,
                        lastName: client.lastName,
                        id: client.id,
                        organizationId: client.organizationId,
                        email: client.email,
                    } as ClientRow))
                );
                setLoading(false);
            })
            .catch(resp => resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })));

    }

    useEffect(() => {
        firebase.auth().onAuthStateChanged(async user => {
            attachCredentialsToApiClient(await user.getIdToken());
            setAuthUser(user);
        });
    }, [])

    useEffect(() => {
        if (authUser && id) {
            loadData();
        }
    }, [authUser, id]);

    const columns = useMemo(
        () => [
            {
                Header: t("app.organizations.name"),
                accessor: r => [r.firstName, r.lastName].filter(v => !!v).join(" "),
                Cell: ({ cell: { value, row: { original: { id, organizationId } } } }) => <PlainLink href={`/organizations/${organizationId}/clients/${id}`}><strong>{value}</strong></PlainLink>,
            },
            {
                Header: t("app.organizations.address"),
                accessor: 'address'
            },
            {
                Header: t("app.organizations.cellPhone"),
                accessor: 'cellPhone'
            },
            {
                Header: t("app.organizations.email"),
                accessor: "email",
            },
            {
                Header: "",
                accessor: "_",
                Cell: ({ cell: { value, row: { original: { id, organizationId } } } }) => <Button onClick={() => router.push(`/portal/organizations/${organizationId}/clients/${id}/details`)}>{t("app.common.view")}</Button>,
                Filter: <></>
            }
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
                <Button sx={{ float: "right" }} onClick={() => router.push(`/portal/organizations/${id}/clients/create`)}>{t("app.organizations.create_client")}</Button>
                <Typography variant="h6">{t("app.menu.clients")}</Typography>
            </Box>
            <DataGrid
                data={data}
                columns={columns}
            />
            {/* <DataTable
                rows={rows.map(r => [
                    <PlainLink href={`/organizations/${r.organizationId}/clients/${r.id}/details`}><strong>{[r.firstName, r.lastName].filter(v => !!v).join(" ")}</strong></PlainLink>,
                    r.address,
                    r.cellPhone,
                    r.email,
                    <Button onClick={() => router.push(`/portal/organizations/${r.organizationId}/clients/${r.id}/details`)}>{t("app.common.view")}</Button>
                ])}
                empty={<>
                    {t("app.organizations.no_clients")}
                    <Link href={`/organizations/${record.id}/clients/create`}>{t("app.organizations.create_one")}</Link>
                </>}
            /> */}
        </>
    )
}