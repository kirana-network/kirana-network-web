import { BrowserRouter } from "react-router-dom";
import AdminApp, { App } from "./App";
import { SnackbarProvider } from 'notistack';

export default function AppContainer(props: any) {
    return (
        <SnackbarProvider maxSnack={5}>
            {/* {
                window.location.pathname.startsWith("/track") &&
                <BrowserRouter basename="track">
                    <TrackTrip />
                </BrowserRouter>
            } */}
            {
                window.location.pathname.startsWith("/admin") &&
                <BrowserRouter basename="admin">
                    <AdminApp />
                </BrowserRouter>
            }
            {
                // !window.location.pathname.startsWith("/track") &&
                !window.location.pathname.startsWith("/admin") &&
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            }
        </SnackbarProvider>
    );
}