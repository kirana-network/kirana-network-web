import { Button, Box, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { useState, useEffect } from "react";
import { useTranslate } from "react-polyglot";
import DataTable from "../../Components/Common/DataTable";
import Loading from "../../Components/Common/Loading";
import { Invitation, ListOfInvitations } from "../../core/apiClient";
import { _OrganizationsApi, _UserprofilesApi } from "../../core/getIt";
import { getLoggingInstance } from "../../core/utils/logger";
import InviteUserDialog from "./InviteUserDialog";

type OrganizationInvitationRow = {
    email: string;
    status: Invitation.StatusEnum;
    id: string;
}

export default function OrganizationInvitations(props: any) {
    const { record } = props;
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<OrganizationInvitationRow[]>([]);
    const t = useTranslate();
    const logger = getLoggingInstance(OrganizationInvitations.name);
    const [open, setOpen] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const loadData = async () => {
        const invitations: ListOfInvitations = await new Promise((resolve, reject) => _OrganizationsApi().listInvitations((record as any).id)
            .then(resolve)
            .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) }));
        setRows((invitations.records || []).map(r => ({
            email: r.email,
            id: r.invitationId,
            status: r.status
        })));
        setLoading(false);
    }

    const deleteInvitation = async (id: string) => {
        const deleteResult = await new Promise((resolve, reject) => _UserprofilesApi().deleteInvitation(props.record.id, id).then(resolve)
            .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) }));
        logger.trace("deleteResult", { deleteResult });
        await loadData();
    }

    useEffect(() => {
        if (record)
            loadData();
    }, [record]);

    useEffect(() => {
        logger.trace("rows", { rows });
    }, [rows]);

    if (loading) {
        return <Loading />
    }

    return (
        <>
            <Box m={2}>
                <Button sx={{float: "right"}} onClick={() => setOpen(true)}>{t("app.organizations.create_invitation")}</Button>
                <Typography variant="h6">{t("app.menu.invitations")}</Typography>
            </Box>
            <DataTable
                headers={[t("app.organizations.email"), t("app.organizations.status"), ""]}
                rows={rows.map(r => [r.email, r.status, r.status == Invitation.StatusEnum.PENDING ? <Button onClick={() => deleteInvitation(r.id)}>{t("app.common.delete")}</Button> : <></>])}
                empty={
                    <Box>
                        {t("app.organizations.no_invitations")}
                    </Box>
                }
            />
            <InviteUserDialog open={open} setOpen={setOpen} onCreate={loadData} />
        </>
    );
}
