import React, { useEffect, useState } from "react";
import { Map, marker, TileLayer, CircleMarker, Tooltip, Point, control, Marker } from "leaflet";
import { sortBy } from "lodash";
import { scale } from "chroma-js"
import dayjs, { Dayjs } from "dayjs";
import firebase from "firebase";
import { Box, Button, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material";
import { useTranslate } from "react-polyglot";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import "./MapPage.css";
import { _NotificationService, _OrganizationsApi, _TripsApi, _UserprofilesApi } from "../core/getIt";
import { GPSUnit, ListOfOrganizationUserProfiles, ListOfUserProfiles, Organization, Trip, UserProfile } from "../core/apiClient";
import { getLoggingInstance } from "../core/utils/logger";
import Loading from "../Components/Common/Loading";
import { useSnackbar } from "notistack";
import scheduleDate from "../core/utils/scheduleDate";

const colors = scale(["lightgreen", "darkgreen"]).colors(6);
const circleMarkerRadiusPx = 5;
const INACTIVE_COLOR = "gainsboro";
const INACTIVE_DURATION = 15 * 60 * 1000; // 15 minutes
let _gpsUnits: GPSUnit[] = [];
var relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)

export default function MapPage(props: any) {
    const logger = getLoggingInstance(MapPage.name);
    const [map, setMap] = useState<Map>()
    const [gpsUnits, setGpsUnits] = useState<GPSUnit[]>([]);
    const [seconds, setCounter] = useState(0);
    const [, setGpsIndexes] = useState<string[]>([]);
    const [circles, setCircles] = useState<CircleMarker[]>([])
    const [gpsToFollow, setGpsToFollow] = useState<GPSUnit>();
    const [zeroGpsUnitReconnectCount, setZeroGpsUnitReconnectCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const { record } = props;
    const [trips, setTrips] = useState<Trip[]>([]);
    const [allTrips, setAllTrips] = useState<Trip[]>([]);
    const { enqueueSnackbar } = useSnackbar();
    const [date, setDate] = useState(scheduleDate.calendarToday());
    const [markers, setMarkers] = useState<Marker[]>([]);
    const [userProfileId, setUserProfileId] = useState<string>();
    const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
    const t = useTranslate();

    const onGpsUpdate = (gpsUnit: GPSUnit) => {
        const units = _gpsUnits.slice().filter(unit => {
            logger.trace("Checking", { unit, gpsUnit })
            return unit.id !== gpsUnit.id;
        });
        units.push(gpsUnit);
        logger.trace("Units", { length: units.length, gpsUnitsLength: _gpsUnits.length })
        _gpsUnits = units;
    }

    const loadUserProfiles = async () => {
        const organizationUserProfiles: ListOfOrganizationUserProfiles = await new Promise((resolve, reject) =>
            _OrganizationsApi().listOrganizationUserProfiles(record.id)
                .then(resolve)
                .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
        )
        const listOfUserProfiles: ListOfUserProfiles = await new Promise((resolve, reject) =>
            _UserprofilesApi().listUserProfiles(JSON.stringify({ ids: organizationUserProfiles.records.map(r => r.userProfileId) }), "[]", "{}")
                .then(resolve)
                .catch(resp => { reject(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })) })
        )
        setUserProfiles(listOfUserProfiles.records || []);
    }

    /** Timer Ticker */
    useEffect(() => {
        const interval = setInterval(() => {
            setCounter(counter => counter + 1);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        _TripsApi().listTrips(record.id)
            .then(result => {
                setAllTrips(result.records)
            })
            .catch(error => {
                error.json()
                    .then(data => enqueueSnackbar(data.message, { variant: "error" }))
                    .catch(e => enqueueSnackbar(e.message, { variant: "error" }));
            });

        loadUserProfiles();
    }, []);

    useEffect(() => {
        setTrips(
            allTrips
                .filter(t => !userProfileId || t.userProfileId == userProfileId)
                .filter(t => t.scheduledAt)
                .filter(t => scheduleDate.isSameDate(t.scheduledAt, date))
        );
    }, [allTrips, date, userProfileId]);

    useEffect(() => {
        // Trip Address
        logger.trace("trips", { trips, date });
        markers.forEach(m => m.remove());
        const _markers = [];
        trips.forEach(trip => {
            const latlng: [number, number] = [trip.location.latitude, trip.location.longitude];
            _markers.push(
                marker(latlng, {
                    interactive: true,
                    title: `[${trip.tripStatus}] ${trip.address}`
                }).addTo(map));
        });
        setMarkers(_markers);
    }, [trips]);

    useEffect(() => {
        const onConnected = (connected: boolean) => {
            if (connected) {
                _NotificationService().listen("GPS_LOCATION_UPDATE", onGpsUpdate);
            }
            else {
                logger.log("disconnected", {
                    _gpsUnits,
                    time: dayjs().subtract(30, "minutes"),
                    updatedAt: _gpsUnits.map(u => dayjs(u.lastUpdatedAt)),
                    checkedTime: _gpsUnits.map(u => dayjs().subtract(30, "minutes").isAfter(dayjs(u.lastUpdatedAt)))
                });
                // If last update was received less than 30 min ago, keep connection alive.
                const gpsUnitNotTooStale = _gpsUnits.some(u => dayjs().subtract(30, "minutes").isAfter(dayjs(u.lastUpdatedAt)));
                if (gpsUnitNotTooStale) {
                    setZeroGpsUnitReconnectCount(0);
                }
                const allowReconnectForZeroGpsUnits = _gpsUnits.length === 0 && zeroGpsUnitReconnectCount <= 3;
                if (allowReconnectForZeroGpsUnits) {
                    setZeroGpsUnitReconnectCount(zeroGpsUnitReconnectCount + 1);
                }
                if (gpsUnitNotTooStale || allowReconnectForZeroGpsUnits) {
                    firebase.auth().currentUser?.getIdToken().then(token => {
                        _NotificationService().connect(token);
                    });
                }
            }
        }

        if (_NotificationService().isConnected()) {
            _NotificationService().listen("GPS_LOCATION_UPDATE", onGpsUpdate);
        }
        else {
            firebase.auth().currentUser?.getIdToken().then(token => {
                _NotificationService().connect(token);
            });
            _NotificationService().listen("CONNECTION_STATUS_UPDATE", onConnected);
        }
        setLoading(false);
        return () => {
            _NotificationService().removeListener("GPS_LOCATION_UPDATE", onGpsUpdate);
            _NotificationService().removeListener("CONNECTION_STATUS_UPDATE", onConnected);
        }
    }, []);

    /** Initialize Map */
    useEffect(() => {
        if (loading) {
            return;
        }
        else {
            const latLng = [(record as Organization).location.latitude, (record as Organization).location.longitude] as any;
            const _map = new Map('map', { zoomControl: false }).setView(latLng, 13);
            setMap(_map);
            new TileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 18,
                id: 'mapbox/dark-v10',
                tileSize: 512,
                zoomOffset: -1,
                accessToken: process.env.REACT_APP_MAPBOX_TOKEN
            }).addTo(_map);
            control.zoom({ position: "topright" }).addTo(_map);
        }
    }, [loading]);

    /** Update Locations of GpsUnits */
    useEffect(() => {
        setGpsUnits(_gpsUnits.slice());
        setGpsIndexes(sortBy(_gpsUnits, ["id"]).map(g => g.id));
        if (gpsToFollow) {
            if (map) {
                map.flyTo({
                    lat: gpsToFollow.locationLatitude, lng: gpsToFollow.locationLongitude,
                }, map.getZoom(), { duration: 0.25 });
            }
        }
    }, [seconds]);

    /** Construct CircleMarker from GpsUnit */
    useEffect(() => {
        setCircles(
            gpsUnits.map(
                (unit, index: number) => {
                    const tooltip = new Tooltip({ direction: "top", offset: new Point(0, -10), permanent: true }).setContent(getTooltipHTML(unit));
                    const marker = new CircleMarker(
                        {
                            lat: unit.locationLatitude, lng: unit.locationLongitude,
                        },
                        {
                            color: dayjs().subtract(INACTIVE_DURATION).isAfter(dayjs(unit.lastUpdatedAt)) ? INACTIVE_COLOR : colors[index % colors.length],
                            radius: circleMarkerRadiusPx,
                            unit
                        } as any,
                    );
                    marker.bindTooltip(tooltip);
                    marker.on("click", () => followGpsUnit(unit));
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
        }
    }, [circles])

    const followGpsUnit = (unit: GPSUnit) => {
        logger.info("SetGpsToFollow", { id: unit.id });
        setGpsToFollow(unit);
    }

    const getTooltipHTML = (unit: GPSUnit): HTMLElement => {
        const element = document.createElement("div");
        element.className = "MuiTooltip-tooltip MuiTooltip-tooltipArrow";
        element.innerHTML = `
            <span>${unit.deviceName}</span>
        `;
        if (unit.extra?.trips){
            element.innerHTML += `<br/><span>Heading to ${unit.extra.trips.map(t => t.address).join(" | ")}</span>`;
        }
        if (unit.lastUpdatedAt) {
            element.innerHTML += `<br/><span>Updated: ${(dayjs(unit.lastUpdatedAt) as any).fromNow()}</span>`;
        }
        return element;
    }

    if (loading) {
        return <Loading />
    }

    return (
        <>
            <Box m={2}>
                <Stack direction="row" spacing={2}>
                    <FormControl>
                        <InputLabel id="driver-label">{t("app.organizations.driver")}</InputLabel>
                        <Select
                            fullWidth={false}
                            style={{ width: 201 }}
                            labelId="driver-label"
                            variant="standard"
                            defaultValue={userProfileId}
                            onChange={(event) => setUserProfileId(event.target.value)}
                        >
                            <MenuItem value={undefined}><em>{t("app.common.all")}</em></MenuItem>
                            {
                                userProfiles?.map(user => <MenuItem value={user.id}>{`${user.firstName} ${user.lastName}`}</MenuItem>)
                            }
                        </Select>
                    </FormControl>
                    <Stack direction="row">
                        <Box>
                            <TextField
                                variant="standard"
                                label={t("app.common.date")}
                                type="date" InputLabelProps={{ shrink: true, }}
                                value={date.format("YYYY-MM-DD")}
                                onChange={(event) => setDate(dayjs(event.target.value))}
                            />
                        </Box>
                        <Box mt={"12px"}>
                            <IconButton onClick={() => setDate(dayjs(date.subtract(1, "day")))}>
                                <ChevronLeftIcon />
                            </IconButton>
                            <IconButton onClick={() => setDate(dayjs(date.add(1, "day")))}>
                                <ChevronRightIcon />
                            </IconButton>
                        </Box>
                    </Stack>
                </Stack>
            </Box>
            <div id="map" className="leaflet"></div>
        </>
    )
}