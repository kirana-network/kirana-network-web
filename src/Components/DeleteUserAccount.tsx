import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslate } from "react-polyglot";
import { _UserprofilesApi } from "../core/getIt";
import { useSnackbar } from "notistack";
import firebase from "firebase";

export function DeleteUserAccount({ userProfileId }) {
    const t = useTranslate();
    const [open, setOpen] = useState(false);
    const [deleteFieldText, setDeleteFieldText] = useState("");
    const { enqueueSnackbar } = useSnackbar();
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <Button onClick={handleClickOpen} variant="contained" color="error">{t("app.userprofiles.delete_my_account")}</Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle color="error">
                    {t("app.userprofiles.delete_my_account")}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t("app.userprofiles.delete_account_warning_message")}
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="type: permanently delete"
                        fullWidth
                        variant="standard"
                        onChange={(event) => setDeleteFieldText(event.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>{t("app.common.cancel")}</Button>
                    <Button
                        onClick={() => {
                            handleClose();
                            _UserprofilesApi()
                                .deleteUserProfile(userProfileId)
                                .then((response) => {
                                    console.log("response", response)
                                    firebase.auth().signOut()
                                        .then(() => {
                                            window.location.href = window.location.origin
                                        })
                                })
                                .catch(resp => resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })));
                        }}
                        variant="contained"
                        color="error"
                        disabled={deleteFieldText != "permanently delete"}
                    >
                        {t("app.common.delete")}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}