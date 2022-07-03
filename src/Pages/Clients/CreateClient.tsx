import { Button, Paper, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Client } from "../../core/apiClient";
import { _OrganizationsApi } from "../../core/getIt";
import { SavingState } from "../../core/hooks";
import ClientForm from "./ClientForm";
import { useSnackbar } from "notistack";
import { useTranslate } from "react-polyglot";

export default function CreateClient(props: any) {
    const [savingState, setSavingState] = useState<SavingState>("NONE");
    const params = useParams();
    const [record, setRecord] = useState<Client>({ organizationId: params.organizationId } as any);
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const t = useTranslate();
    const save = async () => {
        _OrganizationsApi().createClient(record, record.organizationId)
            .then(client => navigate(`/organizations/${client.organizationId}/clients/${client.id}/details`))
            .catch(response => response.json().then(data => enqueueSnackbar(data.message, { variant: "error" })));
    }

    return (
        <Paper>
            <Box m={2}>
                <Typography variant="h6">{t("app.organizations.create_client")}</Typography>
            </Box>
            <ClientForm
                client={record}
                action={(record: Client) => {
                    setRecord(record);
                    return Promise.resolve(record);
                }}
                onSavingStateChange={setSavingState}
                footer={<Box m={2}><Button onClick={save}>Save</Button></Box>}
            />
        </Paper>
    )
}