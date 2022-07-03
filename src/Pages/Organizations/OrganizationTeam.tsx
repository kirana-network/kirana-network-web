import { Box, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { useState, useEffect } from "react";
import { useTranslate } from "react-polyglot";
import DataTable from "../../Components/Common/DataTable";
import Loading from "../../Components/Common/Loading";
import PlainLink from "../../Components/Common/PlainLink";
import { UserProfile, OrganizationUserProfile, ListOfOrganizationUserProfiles, ListOfUserProfiles } from "../../core/apiClient";
import { _OrganizationsApi, _UserprofilesApi } from "../../core/getIt";
import { getLoggingInstance } from "../../core/utils/logger";

type OrganizationTeamRecord = {
    userProfile?: UserProfile;
    userProfileId: string;
    role: OrganizationUserProfile.RoleEnum;
    status: OrganizationUserProfile.StatusEnum;
}

export default function OrganizationTeam(props: any) {
    const { record } = props;
    const t = useTranslate();
    const logger = getLoggingInstance(OrganizationTeam.name);
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<OrganizationTeamRecord[]>([]);
    const { enqueueSnackbar } = useSnackbar();
    const loadTableData = async () => {
        const organizationUserProfiles: ListOfOrganizationUserProfiles = await new Promise((resolve, reject) => _OrganizationsApi().listOrganizationUserProfiles(record.id).then(resolve)
            .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) }));
        const userProfiles: ListOfUserProfiles = await new Promise((resolve, reject) => _UserprofilesApi().listUserProfiles(JSON.stringify({ ids: organizationUserProfiles.records?.map(r => r.userProfileId) }), "[]", "{}").then(resolve)
            .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) }));
        setRows((organizationUserProfiles.records || []).map((p: OrganizationUserProfile) => ({
            userProfile: (userProfiles.records || []).find(r => r.id == p.userProfileId),
            role: p.role,
            status: p.status,
            userProfileId: p.userProfileId,
        })));
        setLoading(false);
    }

    useEffect(() => {
        if (record)
            loadTableData();
    }, [record]);

    if (loading) {
        return <Loading />
    }

    return (
        <>
            <Box m={2}>
                <Typography variant="h6">{record.name} {t("app.menu.team")}</Typography>
            </Box>

            <DataTable
                headers={[t("app.organizations.name"), t("app.organizations.role"), t("app.organizations.status")]}
                rows={rows.map(row => [
                    <PlainLink to={`/userprofiles/${row.userProfileId}`}><strong>{[row.userProfile?.firstName, row.userProfile?.lastName].filter(n => !!n).join(" ")}</strong></PlainLink>,
                    row.role,
                    row.status
                ])}
                empty={t("app.organizations.no_team_members")}
            />
        </>
    );
}
