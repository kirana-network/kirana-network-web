import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import EmojiTransportationIcon from '@mui/icons-material/EmojiTransportation';
import GroupsIcon from '@mui/icons-material/Groups';
import MapIcon from '@mui/icons-material/Map';
import OrganizationIcon from '@mui/icons-material/Domain';
import MailIcon from '@mui/icons-material/Mail';
import { useTranslate } from "react-polyglot";
import { ListItemIcon, ListItemText, Divider, Menu, MenuItem, MenuList } from '@mui/material';
import { useLocation, useNavigate } from 'react-router';

const drawerWidth = 240;

export default function NavigationDrawer(props: any) {
    const { organization, open } = props;
    const t = useTranslate();
    const navigate = useNavigate();
    const location = useLocation();

    let menuItems = [];
    if (!organization) {
        menuItems = [
            { label: t("app.menu.home"), route: `/home`, icon: <OrganizationIcon /> },
        ];
    }
    else {
        menuItems = [
            { level: 0, label: t("app.menu.organization"), route: `/organizations/${organization.id}/details`, icon: <OrganizationIcon /> },
            { level: 0, label: t("app.menu.map"), route: `/organizations/${organization.id}/map`, icon: <MapIcon /> },
            { level: 0, label: t("app.menu.clients"), route: `/organizations/${organization.id}/clients`, icon: <AccountBoxIcon /> },
            { level: 0, label: t("app.menu.trips"), route: `/organizations/${organization.id}/trips`, icon: <EmojiTransportationIcon /> },
            { level: 1, label: t("app.menu.team"), route: `/organizations/${organization.id}/team`, icon: <GroupsIcon /> },
            { level: 1, label: t("app.menu.invitations"), route: `/organizations/${organization.id}/invitations`, icon: <MailIcon /> },
        ];
    }
    return (
        <Box>
            <CssBaseline />
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
                variant="persistent"
                open={open}
                anchor="left"
                ModalProps={{
                    keepMounted: true,
                }}
            >
                <Toolbar />
                <MenuList>
                    {menuItems.filter(i => i.level === 0).map(item => (
                        <MenuItem
                            key={item.route}
                            onClick={() => navigate(item.route)}
                            selected={location.pathname.startsWith(item.route)}
                        >
                            <ListItemIcon>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.label} />
                        </MenuItem>
                    ))}
                    <Divider light />
                    {menuItems.filter(i => i.level === 1).map(item => (
                        <MenuItem
                            key={item.route}
                            onClick={() => navigate(item.route)}
                            selected={location.pathname.startsWith(item.route)}
                        >
                            <ListItemIcon>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.label} />
                        </MenuItem>
                    ))}
                </MenuList>
            </Drawer>
        </Box>
    );
}

