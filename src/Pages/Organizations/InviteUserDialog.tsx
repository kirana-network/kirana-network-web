import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useTranslate } from 'react-polyglot';
import { useState } from 'react';
import { _InvitationsApi, _OrganizationsApi, _UserprofilesApi } from '../../core/getIt';
import { useParams } from 'react-router';
import { useSnackbar } from 'notistack';

export default function FormDialog(props) {
    const { open, setOpen, onCreate } = props;
    const [email, setEmail] = useState("");
    const t = useTranslate();
    const [pending, setPending] = useState(false);
    const { id: organizationId } = useParams();
    const close = () => setOpen(false);
    const { enqueueSnackbar } = useSnackbar();
    const create = async () => {
        setPending(true);
        const createdInvitation = _InvitationsApi()
            .createInvitation({
                email,
                organizationId
            })
            .then(onCreate)
            .catch(resp => resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })))
            .finally(close);
    };
    return (
        <div>
            <Dialog open={open} onClose={close} >
                <DialogTitle>{t("app.organizations.invite")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t("app.organizations.invitation_will_be_sent")}
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label={t("app.login.email_address")}
                        type="email"
                        fullWidth
                        variant="standard"
                        onChange={e => setEmail(e.currentTarget.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button disabled={pending} color="inherit" onClick={close}>{t("app.common.close")}</Button>
                    <Button disabled={pending} onClick={create}>{t("app.common.create")}</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
