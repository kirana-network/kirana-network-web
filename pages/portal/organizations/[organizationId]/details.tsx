import { Box, TextField, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { useTranslate } from "react-polyglot";
import { AddressAutoComplete } from "../../../../components/Common/AddressAutoComplete";
import { SavingState } from "../../../../components/Common/SavingState";
import { Organization } from "../../../../core/apiClient";
import { registerDependencies, _OrganizationsApi } from "../../../../core/getIt";
import { usePartialAutoUpdateForm } from "../../../../core/hooks";
import { getLoggingInstance } from "../../../../core/utils/logger";
import firebase from "firebase";
import { attachCredentialsToApiClient, initializeFirebaseApp } from "../../../../core/utils/auth";
import { useEffect, useState } from "react";

initializeFirebaseApp();
registerDependencies();

export default function OrganizationDetails(props: any) {
    const { record, disabled } = props;
    const l = getLoggingInstance(OrganizationDetails.name);
    const t = useTranslate();
    const { enqueueSnackbar } = useSnackbar();
    const [authUser, setAuthUser] = useState<firebase.User>();
    const partialForm = usePartialAutoUpdateForm<Organization>({
        fields: ["id", "name", "address", "location", "ownerUserProfileId"],
        record,
        action: function Action(_record: Organization) {
            if (record.id) {
                return _OrganizationsApi().updateOrganization(_record, record.id);
            }
            else {
                return _OrganizationsApi().createOrganization(_record);
            }
        },
        _then: function Then(result: any) {
            Object.keys(result).forEach(key => {
                record[key] = result[key]
            });
        },
        _catch: function Error(resp) { l.error(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) },
        _finally: function Finally() { }
    });

    useEffect(() => {
        firebase.auth().onAuthStateChanged(async user => {
            attachCredentialsToApiClient(await user.getIdToken())
            setAuthUser(user);
        });
    }, []);

    return (
        <>
            <Box m={2}>
                <Typography variant="h6">{t("app.menu.organization")}</Typography>
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
            <Box m={2}><SavingState savingState={partialForm.savingState} /></Box>
        </>
    );
}
