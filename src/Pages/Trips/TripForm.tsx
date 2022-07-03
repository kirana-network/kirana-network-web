import { Autocomplete, Box, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import dayjs from "dayjs";
import { values, pick, some } from "lodash";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import { useTranslate } from "react-polyglot";
import { AddressAutoComplete } from "../../Components/Common/AddressAutoComplete";
import { Trip, Client } from "../../core/apiClient";
import { _TripsApi } from "../../core/getIt";
import { usePartialAutoUpdateForm } from "../../core/hooks";
import { getLoggingInstance } from "../../core/utils/logger";
import scheduleDate from "../../core/utils/scheduleDate";
import ShowTrip from "./ShowTrip";

export default function TripForm(props: any) {
    const t = useTranslate();
    const logger = getLoggingInstance(ShowTrip.name);
    const disabled = false;
    const { header, trip, clients, organization, userProfiles, action, footer, onSavingStateChange, formWaitDuration } = props;
    const { enqueueSnackbar } = useSnackbar();

    const partialForm = usePartialAutoUpdateForm<Trip>({
        fields: ["id", "organizationId", "client", "userProfileId", "address", "location", "scheduledAt", "tripStatus", "tripType"],
        record: trip as Trip,
        action: function Action(_record: Trip, previous: Trip) {
            if (_record.tripStatus === Trip.TripStatusEnum.SCHEDULED && previous.tripStatus != _record.tripStatus) {
                if (!_record.scheduledAt) {
                    _record.scheduledAt = scheduleDate.toScheduleDate(scheduleDate.calendarToday());
                }
                else if (dayjs({..._record.scheduledAt} as any).isBefore(dayjs())) {
                    _record.scheduledAt = scheduleDate.toScheduleDate(scheduleDate.calendarToday());
                }
            }
            return action(_record);
        },
        _then: function Then(result: Trip) {
            Object.keys(result).forEach(key => {
                (trip as any)[key] = (result as any)[key]
            });
        },
        _catch: function Error(resp) { logger.error(resp); resp.json().then(data => enqueueSnackbar(data.message, { variant: "error" })); },
        _finally: function Finally() { },
        disabled,
        wait: formWaitDuration
    });

    useEffect(() => {
        if (partialForm) {
            onSavingStateChange(partialForm.savingState)
        }
    }, [partialForm, partialForm.savingState]);
    function getOptionLabel(option: any) {
        // e.g value selected with enter, right from the input
        if (typeof option === 'string') {
            return option;
        }
        if (!option) {
            return "";
        }
        if (option.inputValue) {
            return option.inputValue;
        }
        if (option.title) {
            return option.title;
        }
        return [
            option.firstName, option.lastName,
            option.email ? `[${option.email}]` : option.cellPhone ? `[${option.cellPhone}]` : null
        ].filter(v => v).join(" ");
    }
    return (
        <Box>
            {header}
            <Box m={2}>
                <TextField
                    variant="standard"
                    label={t("app.organizations.name")}
                    disabled={true}
                    value={organization?.name} InputLabelProps={{ shrink: true, }}
                />
            </Box>

            {clients && <Box m={2}>
                <Autocomplete
                    id="client-autocomplete-input"
                    options={clients}
                    disabled={partialForm.partialRecord.id}
                    value={partialForm.partialRecord.client as Client}
                    defaultValue={trip.client as Client}
                    renderInput={(params) => (
                        <TextField defaultValue={getOptionLabel(trip.client)} {...params} variant="standard" label={t("app.organizations.client") + " *"} />
                    )}
                    freeSolo={!disabled} selectOnFocus={!disabled} clearOnBlur handleHomeEndKeys
                    filterOptions={(options: Client[], params) => {
                        const filtered = options.filter(client => {
                            const nonNullAttributes = values(pick(client, ["firstName", "lastName", "cellPhone", "email", "address"])).filter(v => !!v);
                            const found = some(nonNullAttributes, (v: string) => v.toString().toLowerCase().includes(params.inputValue));
                            return found;
                        });

                        logger.trace("filterOptions", { filtered });
                        if (filtered.length === 0 && params.inputValue !== '') {
                            filtered.push({
                                inputValue: t("app.trips.messages.add_a_new_client")
                            } as any);
                        }

                        return filtered;
                    }}
                    onChange={(event, client: any) => {
                        if (typeof client === 'string') {
                            // timeout to avoid instant validation of the dialog's form.
                            // setTimeout(() => {
                            //     setClientDialogOpen(true);
                            // });
                        } else if (client && !client.id) {
                            // setClientDialogOpen(true);
                        } else {
                            partialForm.setPartialRecord({ ...partialForm.partialRecord, client });
                        }
                    }}
                    getOptionLabel={getOptionLabel}
                    renderOption={(props: any, client: any) => (
                        <Box component="li" {...props}>
                            {
                                client.inputValue ? client.inputValue : ""
                            }
                            <Box>
                                <Typography component="p" variant="body2">{`${client.firstName ?? ""} ${client.lastName ?? ""}`}</Typography>
                                <Typography component="p" variant="caption">{client.email ?? ""}</Typography>
                                <Typography component="p" variant="caption">{client.cellPhone ?? ""}</Typography>
                                <Typography component="p" variant="caption">{client.address ?? ""}</Typography>
                            </Box>
                        </Box>
                    )}
                />
            </Box>}

            {userProfiles && <Box m={2}>
                <FormControl required={true}>
                    <InputLabel id="driver-label">{t("app.organizations.driver")}</InputLabel>
                    <Select
                        fullWidth={false} required={true}
                        style={{ width: 201 }}
                        labelId="driver-label"
                        variant="standard"
                        defaultValue={trip.userProfileId}
                        onChange={(event) => partialForm.setPartialRecord({ ...partialForm.partialRecord, userProfileId: event.target.value as any })}
                    >
                        <MenuItem value={undefined}><em>None</em></MenuItem>
                        {
                            userProfiles?.map(user => <MenuItem value={user.id}>{`${user.firstName} ${user.lastName}`}</MenuItem>)
                        }
                    </Select>
                </FormControl>
            </Box>}
            <Box m={2}>
                <FormControl required={true}>
                    <InputLabel id="trip-type-label">{t("app.trips.trip_type")}</InputLabel>
                    <Select
                        fullWidth={false}
                        style={{ width: 201 }}
                        labelId="trip-type-label"
                        variant="standard"
                        defaultValue={trip.tripType || Trip.TripTypeEnum.NONE}
                        onChange={(event) => partialForm.setPartialRecord({ ...partialForm.partialRecord, tripType: event.target.value as any })}
                    >
                        {
                            Object.keys(Trip.TripTypeEnum)
                                .map(key => <MenuItem value={key}>{key}</MenuItem>)
                        }
                    </Select>
                </FormControl>
            </Box>
            <Box m={2}>
                <FormControl required={true}>
                    <InputLabel id="trip-status-label">{t("app.trips.status")}</InputLabel>
                    <Select
                        fullWidth={false}
                        style={{ width: 201 }}
                        labelId="trip-status-label"
                        variant="standard"
                        defaultValue={trip.tripStatus}
                        onChange={(event) => partialForm.setPartialRecord({ ...partialForm.partialRecord, tripStatus: event.target.value as any })}
                    >
                        {
                            Object.keys(Trip.TripStatusEnum).filter(key => key !== "ONROUTE")
                                .map(key => <MenuItem value={key}>{key}</MenuItem>)
                        }
                    </Select>
                </FormControl>
            </Box>
            <Box m={2}>
                <TextField
                    id="scheduledAt"
                    variant="standard"
                    label={t("app.trips.scheduledAt")}
                    type="date" InputLabelProps={{ shrink: true, }}
                    value={partialForm.partialRecord.scheduledAt ? dayjs(partialForm.partialRecord.scheduledAt as any).format("YYYY-MM-DD") : null}
                    onChange={(event) => partialForm.setPartialRecord({ ...partialForm.partialRecord, scheduledAt: event.target.value as any })}
                />
            </Box>
            <Box m={2}>
                <AddressAutoComplete
                    onChange={(event) => partialForm.setPartialRecord({
                        ...partialForm.partialRecord,
                        address: event?.address,
                        location: event?.location
                    })}
                    initialValue={partialForm.partialRecord.address}
                    disabled={disabled}
                />
            </Box>
            {footer}
        </Box>
    )
}