import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';

const pages = [
    { name: "Track", path: "/track" },
    { name: "Admin", path: "/admin" },
];

const LandingPageNavbar = () => {
    return (
        <AppBar position="static">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <Typography
                        variant="h6"
                        noWrap
                        component="a"
                        href="/"
                        sx={{
                            mr: 2,
                            fontWeight: 700,
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        kirana.network
                    </Typography>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {""}
                    </Typography>
                    <Box sx={{ display: { xs: 'flex' } }}>
                        {pages.map(({ name, path }) => (
                            <Button
                                variant="text"
                                key={name}
                                onClick={() => window.location.href = path}
                                sx={{ my: 2, display: 'block' }}
                            >
                                {name}
                            </Button>
                        ))}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};
export default LandingPageNavbar;
