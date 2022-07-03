import { Paper, Box, Checkbox, FormControlLabel, FormGroup, TextField } from "@mui/material";
import { useEffect } from "react";
import { useTranslate } from "react-polyglot";
import { Client } from "../../../core/apiClient";
import { registerDependencies } from "../../../core/getIt";
import { usePartialAutoUpdateForm } from "../../../core/hooks";
import { attachCredentialsToApiClient, initializeFirebaseApp } from "../../../core/utils/auth";
import { getLoggingInstance } from "../../../core/utils/logger";
import { AddressAutoComplete } from "../../Common/AddressAutoComplete";
import firebase from "firebase";


initializeFirebaseApp();
registerDependencies();

export default function ClientForm(props: any) {
    const logger = getLoggingInstance(ClientForm.name);
    const t = useTranslate();
    const disabled = false;
    const { client } = props;
    const partialForm = usePartialAutoUpdateForm<Client>({
        fields: ["id", "organizationId", "address", "location", "firstName", "lastName", "homePhone", "cellPhone", "email", "notes", "options"],
        record: client as Client,
        action: (_record: Client) => props.action(_record),
        _then: (result) => Object.keys(result).forEach(key => (client as any)[key] = result[key]),
        _catch: (response) => {
            partialForm.setPartialRecord(client);
        },
        _finally: () => { }
    });

    useEffect(() => {
        if (partialForm) {
            props.onSavingStateChange(partialForm.savingState);
        }
    }, [partialForm, partialForm.savingState]);

    // useEffect(() => {
    //     firebase.auth().onAuthStateChanged(async user => {
    //         attachCredentialsToApiClient(await user.getIdToken());
    //         setAuthUser(user);
    //     })
    // }, [])

    return (
        <Box sx={{ paddingBottom: 2 }}>
            <Box m={2}>
                <TextField
                    variant="standard"
                    label={t("app.clients.first_name")}
                    value={partialForm.partialRecord.firstName}
                    onChange={(event) => partialForm.setPartialRecord({
                        ...partialForm.partialRecord,
                        firstName: event.target.value
                    })}
                    disabled={disabled}
                />
            </Box>
            <Box m={2}>
                <TextField
                    variant="standard"
                    label={t("app.clients.last_name")}
                    value={partialForm.partialRecord.lastName}
                    onChange={(event) => partialForm.setPartialRecord({
                        ...partialForm.partialRecord,
                        lastName: event.target.value
                    })}
                    disabled={disabled}
                />
            </Box>
            <Box m={2}>
                <TextField
                    variant="standard"
                    label={t("app.clients.home_phone")}
                    value={partialForm.partialRecord.homePhone}
                    onChange={(event) => partialForm.setPartialRecord({
                        ...partialForm.partialRecord,
                        homePhone: event.target.value || null
                    })}
                    disabled={disabled}
                />
            </Box>
            <Box m={2}>
                <TextField
                    variant="standard"
                    label={t("app.clients.cell_phone")}
                    value={partialForm.partialRecord.cellPhone}
                    onChange={(event) => partialForm.setPartialRecord({
                        ...partialForm.partialRecord,
                        cellPhone: event.target.value || null
                    })}
                    disabled={disabled}
                />
            </Box>
            <Box m={2}>
                <TextField
                    variant="standard"
                    type={"email"}
                    label={t("app.clients.email")}
                    value={partialForm.partialRecord.email}
                    onChange={(event) => partialForm.setPartialRecord({
                        ...partialForm.partialRecord,
                        email: event.target.value || null
                    })}
                    disabled={disabled}
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
                <TextField
                    multiline={true}
                    rows={5}
                    variant="standard"
                    label={t("app.clients.notes")}
                    value={partialForm.partialRecord.notes}
                    onChange={(event) => partialForm.setPartialRecord({
                        ...partialForm.partialRecord,
                        notes: event.target.value
                    })}
                    disabled={disabled}
                />
            </Box>
            <Box m={2}>
                <FormGroup sx={{ width: "fit-content" }}>
                    <FormControlLabel control={<Checkbox onChange={(value) => partialForm.setPartialRecord({
                        ...partialForm.partialRecord,
                        options: { ...(partialForm.partialRecord.options || {}), enableNotifications: value.target.checked }
                    })} checked={client.options?.enableNotifications} />} label={t("app.clients.enable_notifications")} />
                </FormGroup>
            </Box>
            {props.footer}
        </Box>
    );
}