import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { useTranslate } from "react-polyglot";
import { useNavigate } from "react-router";
import { AddressAutoComplete } from "../../Components/Common/AddressAutoComplete";
import { Organization } from "../../core/apiClient";
import { _OrganizationsApi } from "../../core/getIt";
import { usePartialAutoUpdateForm } from "../../core/hooks";
import { getLoggingInstance } from "../../core/utils/logger";
import OrganizationForm from "./OrganizationForm";

export default function CreateOrganizationForm(props: any) {
    const t = useTranslate();
    const { record, disabled } = props;
    const l = getLoggingInstance(OrganizationForm.name);
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const partialForm = usePartialAutoUpdateForm<Organization>({
        fields: ["name", "address", "ownerUserProfileId"],
        record,
        action: function Action(_record: Organization) {
            return Promise.resolve({} as any);
        },
        _then: function Then(result: any) {
            Object.keys(result).forEach(key => {
                record[key] = result[key]
            });
        },
        _catch: function Error(error) { error.json().then(data => enqueueSnackbar(data.message, { variant: "error" })).finally(() => l.error(error)) },
        _finally: function Finally() { }
    });
    const save = () => {
        setSaving(true);
        _OrganizationsApi()
            .createOrganization(partialForm.partialRecord)
            .then(organization => {
                navigate(`/organizations/${organization.id}/details`);
                props.onCreate(organization);
            })
            .catch(response => { response.json().then(data => enqueueSnackbar(data.message, { variant: "error" })).finally(() => l.error(response)) })
            .finally(() => setSaving(false));
    }
    return (
        <>
            <Box sx={{ paddingBottom: 2 }}>
                <Box m={2}>
                    <Typography variant="h6">{t("app.organizations.create_organization")}</Typography>
                </Box>
                <Box m={2}>
                    <TextField
                        variant="standard"
                        label={t("app.organizations.name")}
                        value={partialForm.partialRecord.name}
                        disabled={disabled}
                        onChange={(event) => { partialForm.setPartialRecord({ ...partialForm.partialRecord, name: event.target.value }) }}
                    />
                </Box>
                <Box m={2}>
                    <AddressAutoComplete
                        onChange={(event) => partialForm.setPartialRecord({
                            ...partialForm.partialRecord,
                            address: event?.address,
                            location: event?.location
                        })}
                        initialValue={partialForm.partialRecord.address}
                        disabled={disabled}
                    />
                </Box>
                <Box m={2}>
                    <Button onClick={save} disabled={saving}>{t("app.common.save")}</Button>
                </Box>
            </Box>
        </>
    );

}