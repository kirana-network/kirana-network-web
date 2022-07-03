import { TableContainer, Paper, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import firebase from "firebase";
import { useSnackbar } from "notistack";
import * as react from "react";
import { useEffect, useState } from "react";
import { useTranslate } from "react-polyglot";
import { ListOfOrganizations, OrganizationUserProfile, UserProfile, UserProfileOrganization } from "../../core/apiClient";
import { registerDependencies, _OrganizationsApi, _UserprofilesApi } from "../../core/getIt";
import { getLoggingInstance } from "../../core/utils/logger";
import Loading from "../../components/Common/Loading";
import DataTable from "../../components/Common/DataTable";
import PlainLink from "../../components/Common/PlainLink";
import { attachCredentialsToApiClient, initializeFirebaseApp } from "../../core/utils/auth";

initializeFirebaseApp();
registerDependencies();


type UserOrganizationRow = {
    id: string;
    name: string;
    address: string;
    ownerUserProfileId: string;
    role?: OrganizationUserProfile.RoleEnum;
    ownerUserProfile?: UserProfile;
}

export default function ListOrganizations() {
    const logger = getLoggingInstance(ListOrganizations.name);
    const t = useTranslate();
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState("");
    const [rows, setRows] = useState<UserOrganizationRow[]>([]);
    const { enqueueSnackbar } = useSnackbar();
    useEffect(() => {
        firebase.auth().onIdTokenChanged(async user => {
            attachCredentialsToApiClient(await user.getIdToken());
            setUid(user.uid);
        });
    }, []);

    useEffect(() => {
        if (uid) {
            loadUserOrganizationData(uid)
                .then((data) => setRows(data))
                .catch(resp => resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })))
                .finally(() => setLoading(false));
        }
    }, [uid]);

    if (loading) {
        return <Loading />
    }

    return <ListOrganizationsTable rows={rows} />
}

async function loadUserOrganizationData(uid: string): Promise<UserOrganizationRow[]> {
    const logger = getLoggingInstance(loadUserOrganizationData.name);
    logger.trace("Started loadUserOrganizationData");

    const userProfile: UserProfile = await new Promise((resolve, reject) => _UserprofilesApi().retrieveUserProfile(uid).then(resolve).catch(reject));
    logger.trace("userProfile", { userProfile });
    const listUserProfiles: UserProfileOrganization[] = await new Promise((resolve, reject) => _UserprofilesApi().listUserProfileOrganizations(uid).then(resolve).catch(reject).finally(() => logger.trace("done")));
    logger.trace("listUserProfiles", { listUserProfiles });

    const organizations: ListOfOrganizations = await new Promise((resolve, reject) =>
        _OrganizationsApi().listOrganizations("", "[]", JSON.stringify({ ids: listUserProfiles.map(u => u.organizationId) })).then(resolve).catch(reject)
    );
    const getUserProfile = (id: string) => id == userProfile.id ? userProfile : null as any;
    return (organizations.records || [])?.map(o => ({
        address: o.address,
        id: o.id,
        name: o.name,
        ownerUserProfile: getUserProfile(o.ownerUserProfileId),
        ownerUserProfileId: o.ownerUserProfileId,
        role: listUserProfiles?.find(u => u.organizationId == o.id)?.role
    }));
}

function ListOrganizationsTable(props: any) {
    const t = useTranslate();
    const rows = props.rows as UserOrganizationRow[];

    return (
        <DataTable
            headers={[t("app.organizations.name"), t("app.organizations.address"), t("app.organizations.role"), t("app.organizations.owner")]}
            rows={rows.map(row => [
                <PlainLink href={`/portal/organizations/${row.id}/details`}><strong>{row.name}</strong></PlainLink>,
                row.address,
                row.role,
                [row.ownerUserProfile?.firstName, row.ownerUserProfile?.lastName].filter(r => !!r).join(" ")
            ])}
            empty={t("app.organizations.no_organizations")}
        />
    );
}