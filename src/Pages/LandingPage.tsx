import { Box, Typography } from "@mui/material";
import LandingPageNavbar from "../Components/Layout/LandingPageNavbar";

export default function LandingPage() {
    return (
        <Box width="100%" height="100vh" style={{ backgroundImage: "url(https://raw.githubusercontent.com/ahsanazim/slack-landing-page/master/screen_caps/menu_background.jpg)" }}>
            <LandingPageNavbar />
            <Box alignItems={"center"} textAlign="center" height="100%" width="100%">
                <Box pt={20} color="white">
                    <Typography variant="h3" fontFamily="'Noto Sans', sans-serif">Welcome to the Kirana Network</Typography>
                    <Typography variant="h5" fontFamily="'Noto Sans', sans-serif">Rethink how deliveries are made</Typography>
                </Box>
            </Box>
        </Box>
    )
}