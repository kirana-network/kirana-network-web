import { BrowserRouter } from "react-router-dom";
import AdminApp from "./App";
import TrackTrip from "./Pages/Trips/TrackTrip";
import { SnackbarProvider } from 'notistack';

export default function AppContainer(props: any) {
    return (
        <SnackbarProvider maxSnack={5}>
            {
                window.location.pathname.startsWith("/track") &&
                <BrowserRouter basename="track">
                    <TrackTrip />
                </BrowserRouter>
            }
            {
                window.location.pathname.startsWith("/admin") &&
                <BrowserRouter>
                    <AdminApp />
                </BrowserRouter>
            }
            {/* TODO: Normal App and Home Page */}
        </SnackbarProvider>
    );
}