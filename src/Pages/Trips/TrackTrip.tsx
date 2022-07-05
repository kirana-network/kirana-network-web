import { useEffect, useState } from "react";
import { useTranslate } from "react-polyglot";
import { Routes, Route, useParams, useNavigate } from "react-router";
import { GPSUnit, ListOfTripNotes, Trip } from "../../core/apiClient";
import { _NotificationService, _TripsApi } from "../../core/getIt";
import { Map, TileLayer, marker, CircleMarker, Tooltip, Point, latLngBounds } from "leaflet";
import { scale } from "chroma-js";
import { get, sortBy } from "lodash";
import dayjs from "dayjs";
import { useSnackbar } from "notistack";
import LandingPageNavbar from "../../Components/Layout/LandingPageNavbar";
import { Box, Button, CssBaseline, Grid, IconButton, Paper, Step, StepContent, StepLabel, Stepper, TextField, Typography } from "@mui/material";
import { ThemeProvider } from "styled-components";
import getTheme from "../../theme";
import { Launch } from "@mui/icons-material";

export function TrackPage() {
    const navigate = useNavigate();
    const [id, setId] = useState("");

    function search() {
        if (id) {
            navigate(id)
        }
    }

    return (
        <Box width="100%" height="100vh" style={{ backgroundImage: "url(https://raw.githubusercontent.com/ahsanazim/slack-landing-page/master/screen_caps/menu_background.jpg)" }}>
            <LandingPageNavbar />
            <Box alignItems={"center"} textAlign="center" height="100%" width="100%">
                <Box mt={20} py={20}>
                    <Box display="block">
                        <TextField onChange={evt => setId(evt.currentTarget.value)} id="outlined-basic" label="Tracking Id" variant="filled" />
                    </Box>
                    <Box mt={3}>
                        <Button onClick={search} variant="contained">Search</Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

let _gpsUnits: GPSUnit[] = [];
const RETRIEVE_TRIP_INTERVAL_MS = 60000;

export function TrackTrip(props: any) {
    const [loading, setLoading] = useState(true);
    const [trip, setTrip] = useState<Trip>();
    const { id } = useParams();
    const [tripKeepAliveCounter, setTripKeepAliveCounter] = useState(0);
    const t = useTranslate();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const [tripNotes, setTripNotes] = useState<ListOfTripNotes>();

    function retrieveTrip() {
        _TripsApi()
            .retrieveTripStatus(id).then(setTrip)
            .catch(resp => {
                resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" }));
                navigate("/")
            })
            .finally(() => setLoading(false));
        _TripsApi()
            .listTripNotes(id as string)
            .then(setTripNotes)
            .then(() => setLoading(false))
            .catch(console.error);
        _TripsApi().retrieveProofOfDelivery(id as string)
            .then(console.log).catch((response) => {
                console.log(response.status);
                console.error(response);
            });

    }

    function pingWebsocket(trip: Trip) {
        // TODO: Improve how this connection stays awake. Polling is okay but can be improved. 
        if (trip?.tripStatus === Trip.TripStatusEnum.ONROUTE && !_NotificationService().isConnected()) {
            // TODO: Send message to ping and stay connected to watch this particular trip updates if GPSUnitId is active
            _NotificationService().connectTrip(trip.id);
        }
    }
    useEffect(() => {
        _NotificationService().listen("GPS_LOCATION_UPDATE", onGpsUpdate);
        return () => _NotificationService().removeListener("GPS_LOCATION_UPDATE", onGpsUpdate);
    }, []);

    useEffect(() => {
        if (id) {
            retrieveTrip();
        }
    }, [id]);

    useEffect(() => {
        if (!trip) {
            return;
        }
        if (trip.tripStatus !== Trip.TripStatusEnum.CANCELLED) {
            pingWebsocket(trip);
        }
        if (trip.tripStatus === Trip.TripStatusEnum.COMPLETED) {
            _NotificationService().disconnect();
        }
    }, [trip]);

    useEffect(() => {
        const timer = setTimeout(() => {
            retrieveTrip();
            setTripKeepAliveCounter(tripKeepAliveCounter + 1);
        }, RETRIEVE_TRIP_INTERVAL_MS);
        return () => clearTimeout(timer);
    }, [tripKeepAliveCounter]);


    const onGpsUpdate = (gpsUnit: GPSUnit) => {
        const units = _gpsUnits.slice().filter(unit => {
            return unit.id !== gpsUnit.id;
        });
        units.push(gpsUnit);
        _gpsUnits = units;
    }

    if (loading) {
        return <></>;
    }

    return (
        <Box>
            <LandingPageNavbar />
            <Grid p={3} container spacing={3}>
                <Grid item xs={4}>
                    <TripDetailsStepper tripNotes={tripNotes} />
                </Grid>
                <Grid item xs={8}>
                    <TripMap record={trip} />
                </Grid>
            </Grid>
        </Box>
    )
}

function TripMap(props: any) {
    const [map, setMap] = useState<Map>();
    const [pointerEvents,] = useState<any>("none");
    const { record } = props;
    const [seconds, setCounter] = useState(0);
    const [gpsUnits, setGpsUnits] = useState<GPSUnit[]>([]);
    const [, setGpsIndexes] = useState<string[]>([]);
    const [circles, setCircles] = useState<CircleMarker[]>([]);
    const t = useTranslate();
    const colors = scale(["lightgreen", "darkgreen"]).colors(6);
    /** Update Locations of GpsUnits */
    useEffect(() => {
        setGpsUnits(_gpsUnits.slice());
        setGpsIndexes(sortBy(_gpsUnits, ["id"]).map(g => g.id));
    }, [seconds]);
    /** Timer Ticker */
    useEffect(() => {
        const interval = setInterval(() => {
            setCounter(counter => counter + 1);
        }, 5000);
        return () => clearInterval(interval);
    }, []);
    /** Construct CircleMarker from GpsUnit */
    useEffect(() => {
        setCircles(
            gpsUnits.filter(unit => unit.locationLatitude && unit.locationLongitude).map(
                (unit) => {
                    const tooltip = new Tooltip({ direction: "top", offset: new Point(0, -10) }).setContent(getTooltipHTML(unit, t("Trip on route")));
                    const marker = new CircleMarker(
                        {
                            lat: unit.locationLatitude, lng: unit.locationLongitude,
                        },
                        {
                            color: colors[0],
                            radius: 5,
                            unit
                        } as any,
                    );
                    marker.bindTooltip(tooltip);
                    return marker;
                }
            )
        );

        if (map) {
            circles.forEach(circle => circle.removeFrom(map));
        }
    }, [gpsUnits]);

    /** Draw gps unit circles */
    useEffect(() => {
        if (map) {
            circles.forEach(circle => {
                circle.addTo(map);
            });
            if (get(record, "location") && circles[0]) {
                map?.fitBounds(
                    latLngBounds(circles[0].getLatLng(), [record.location!.latitude, record.location!.longitude]),
                    {
                        animate: true,
                        padding: [100, 100],
                    }
                );
            }
        }
    }, [circles])
    /** Initialize Map */
    useEffect(() => {
        if (!map && record && record.tripStatus !== Trip.TripStatusEnum.CANCELLED) {
            const latlng: [number, number] = [record.location!.latitude, record.location!.longitude];
            const _map = new Map('map', { zoomControl: false }).setView(latlng, 18);
            setMap(_map);
            new TileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 18,
                id: 'mapbox/dark-v10',
                tileSize: 512,
                zoomOffset: -1,
                accessToken: process.env.REACT_APP_MAPBOX_TOKEN
            }).addTo(_map);

            // Trip Address
            marker(latlng, {
                interactive: false
            }).addTo(_map);
        }
    }, [record]);
    const getTooltipHTML = (unit: GPSUnit, content: string): HTMLElement => {
        const element = document.createElement("div");
        element.className = "MuiTooltip-tooltip MuiTooltip-tooltipArrow";
        element.innerHTML = `
            <span>${content}</span>
            <br/>
            <span>
                ${(dayjs(unit.lastUpdatedAt) as any).fromNow && (dayjs(unit.lastUpdatedAt) as any).fromNow()}
            </span>
        `;
        return element;
    }
    if (!record || (record && record.tripStatus === Trip.TripStatusEnum.CANCELLED)) {
        return <></>;
    }
    else {
        return (
            <div id="map" style={{ pointerEvents, borderRadius: 20 }} className="leaflet"></div>
        )
    }
}


export default function TripDetailsStepper(props: { tripNotes: ListOfTripNotes }) {
    const { tripNotes } = props;
    const t = useTranslate();
    if (!tripNotes) {
        return <></>
    }
    return (
        <Box sx={{ maxWidth: 400 }}>
            <Stepper activeStep={tripNotes.total - 1} orientation="vertical">
                {tripNotes.records?.map((step, index) => (
                    <Step key={step.createdAt}>
                        <StepLabel
                            optional={
                                <Box>
                                    <Typography variant="caption">{step.content}</Typography>
                                    {
                                        step.extra?.exploreUrl &&
                                        <IconButton size="small" href={step.extra?.exploreUrl} target="_blank" aria-label="launch">
                                            <Launch />
                                        </IconButton>
                                    }
                                </Box>
                            }
                        >
                            <Typography>
                                {new Date(step.createdAt).toLocaleString()}
                            </Typography>
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>
        </Box>
    );
}
