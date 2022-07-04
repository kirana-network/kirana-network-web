import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import InfoIcon from "@mui/icons-material/InfoOutlined";
import firebase from "firebase";
import { FormControl, InputLabel, Select, MenuItem, PaletteMode, Tooltip, Avatar, CircularProgress } from '@mui/material';
import { makeStyles } from "@mui/styles";
import { useTranslate } from "react-polyglot";
import { Organization } from '../../core/apiClient';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Logout from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import WarningOutlinedIcon from "@mui/icons-material/WarningOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { container } from 'tsyringe';
import { NotificationService } from '../../core/services/notificationService';
import { getLoggingInstance } from '../../core/utils/logger';

type TopAppBarProps = {
    showButtons: boolean;
    showMenuIcon: boolean;
    title: string;
    organization?: Organization;
    organizations?: Organization[];
    onChange: (organization: Organization) => void;
    mode: PaletteMode;
    setMenuOpen: (val: boolean) => void;
    menuOpen: boolean;
}

export default function TopAppBar(props: TopAppBarProps) {
    const t = useTranslate();
    const [anchorEl, setAnchorEl] = useState<any>();
    const [open, setOpen] = useState(false);

    const navigate = useNavigate();
    return (
        <Box>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    {
                        props.showMenuIcon &&
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{ mr: 2 }}
                            onClick={() => props.setMenuOpen(!props.menuOpen)}
                        >
                            <MenuIcon />
                        </IconButton>
                    }

                    <Typography variant="h6" component="div" sx={{ marginRight: "50px" }}>
                        {props.title}
                    </Typography>

                    {props.showButtons && <OrganizationsDropdown {...props} />}

                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {""}
                    </Typography>
                    {/* <Tooltip title={props.mode === "dark" ? t("app.menu.switch_to_light_mode") : t("app.menu.switch_to_dark_mode")}>
                        <IconButton sx={{ mr: 4 }}
                            onClick={() => {
                                localStorage.setItem("mode", props.mode === "dark" ? "light" : "dark");
                                window.location.reload();
                            }}
                            color="inherit"
                        >
                            {props.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                    </Tooltip> */}
                    <Tooltip title={t("app.menu.licenses")}>
                        <IconButton  sx={{ mr: 4 }}
                            onClick={() => window.open("oss-licenses.txt")}
                            color="inherit"
                            size="small"
                        >
                            <InfoIcon />
                        </IconButton>
                    </Tooltip>
                    {
                        props.showButtons &&
                        <>
                            <NotificationServiceIcon />
                            <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
                                <Tooltip title={t("app.menu.profile")}>
                                    <IconButton onClick={e => { setAnchorEl(e.currentTarget); setOpen(true) }} size="small" sx={{ ml: 2 }}>
                                        <Avatar src={firebase.auth().currentUser?.photoURL} />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={() => setOpen(false)}
                                onClick={() => setOpen(false)}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                                <MenuItem onClick={() => navigate(`/userprofiles/${firebase.auth().currentUser.uid}/details`)}>
                                    <ListItemIcon>
                                        <PersonIcon fontSize="small" />
                                    </ListItemIcon>
                                    {t("app.menu.profile")}
                                </MenuItem>
                                <MenuItem onClick={() => {
                                    firebase.auth().signOut()
                                        .then(() => {
                                            window.location.href = window.location.origin
                                        })
                                }}>
                                    <ListItemIcon>
                                        <Logout fontSize="small" />
                                    </ListItemIcon>
                                    {t("app.menu.logout")}
                                </MenuItem>
                            </Menu>
                        </>
                    }
                </Toolbar>
            </AppBar>
        </Box>
    );
}

function OrganizationsDropdown(props: any) {
    const t = useTranslate();
    const useStyles = makeStyles({
        root: { "& .MuiSelect-select": { padding: "8px 14px" } },
    });
    const classes = useStyles();

    if (!props.organizations) {
        return <></>;
    }
    return (
        <FormControl sx={{ minWidth: 80 }}>
            <InputLabel>{t("app.menu.organization")}</InputLabel>
            <Select
                value={props.organization?.id}
                label={t("app.menu.organization")}
                onChange={props.onChange}
                className={`${classes.root}`}
                autoWidth
            >
                {props.organizations.map((o: Organization) => <MenuItem value={o.id}>{o.name}</MenuItem>)}
            </Select>
        </FormControl>
    )
}

function NotificationServiceIcon(props: any) {
    const notificationService = container.resolve<NotificationService>("NotificationService");
    const [disconnected, setDisconnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const [socketConnectionError, setSocketConnectionError] = useState(false);
    const logger = getLoggingInstance(NotificationServiceIcon.name);
    const t = useTranslate();
    const onConnectionStatusUpdate = (connected: boolean) => {
        setDisconnected(!connected);
    };

    const reconnect = () => {
        setReconnecting(true);
        firebase.auth().currentUser?.getIdToken().then(token => {
            if (token) {
                notificationService.connect(token);
                setTimeout(() => setReconnecting(false), 3000);
            }
        }).catch(error => {
            setReconnecting(false);
            setSocketConnectionError(true);
        });
    }

    /** Sync with NotificationService */
    useEffect(() => {
        onConnectionStatusUpdate(notificationService.isConnected());
        notificationService.listen("CONNECTION_STATUS_UPDATE", onConnectionStatusUpdate);
        return () => {
            notificationService.removeListener("CONNECTION_STATUS_UPDATE", onConnectionStatusUpdate);
        }
    }, []);

    return (
        <>
            {
                (disconnected && !reconnecting) &&
                <Tooltip placement="bottom" title={t("app.menu.disconnected_message")}>
                    <IconButton onClick={reconnect}>
                        <WarningOutlinedIcon color="warning" />
                    </IconButton>
                </Tooltip>
            }
            {disconnected && reconnecting && <CircularProgress size={20} />}
            {
                socketConnectionError &&
                <Tooltip placement="bottom" title={t("app.menu.socket_connection_error_message")}>
                    <ErrorOutlineIcon style={{ padding: 12 }} color="error" />
                </Tooltip>
            }
        </>
    )
}