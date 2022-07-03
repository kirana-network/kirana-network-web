import React from "react";
import { useEffect } from "react";
import { debounce } from "lodash";
import { useTranslate } from "react-polyglot";
import { Autocomplete, Box, Grid, TextField, Typography } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useSnackbar } from "notistack";

type Feature = {
    type: string;
    geometry: any;
    properties: any;
    bbox: [number, number, number, number];
}

type AddressAutoCompleteProps = {
    onChange: (event: any) => void;
    initialValue: string;
    disabled?: boolean;
};
function formatAddress(properties: any) {
    if (properties?.postalcode) {
        return `${properties.label} (${properties.postalcode})`;
    }
    else {
        return properties?.label;
    }
}

export function AddressAutoComplete(props: AddressAutoCompleteProps) {
    const [value, setValue] = React.useState<Feature>(null as any);
    const [inputValue, setInputValue] = React.useState('');
    const [options, setOptions] = React.useState<Feature[]>([]);
    const t = useTranslate();
    const { enqueueSnackbar } = useSnackbar();

    const memoFetch = React.useMemo(
        () =>
            debounce((value: any, callback: any) => {
                fetch(`https://app.geocodeapi.io/api/v1/search?apikey=${process.env.REACT_APP_GEOCODE_API_KEY}&text=${value}`)
                    .then(async (response: Response) => {
                        if (response.status > 200) {
                            enqueueSnackbar(t("app.common.messages.error_occurred"), { variant: "error" });
                        }
                        callback((await response.json()).features);
                    })
                    .catch(error => {
                        enqueueSnackbar(error && (error.message || t("app.common.messages.error_occurred"), "warning"))
                    });
            }, 1000),
        [],
    );

    useEffect(() => {
        if (props.initialValue) {
            const val = {
                properties: { label: props.initialValue }
            } as any;
            setValue(val);
        };
    }, [props.initialValue]);

    useEffect(() => {
        let active = true;

        if (inputValue === '') {
            setOptions(value ? [value] : []);
            return undefined;
        }

        memoFetch(inputValue, (results: any[]) => {
            if (active) {
                let newOptions: any[] = [];

                if (value) {
                    newOptions = [value];
                }

                if (results) {
                    newOptions = [...newOptions, ...results];
                }
                setOptions(newOptions);
            }
        });

        return () => {
            active = false;
        };
    }, [value, inputValue, memoFetch]);

    return (
        <Autocomplete
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.properties.label)}
            filterOptions={(x) => x}
            options={options}
            autoComplete
            includeInputInList
            filterSelectedOptions
            autoHighlight
            disabled={props.disabled}
            value={value}
            onChange={(event: any, newValue: Feature | any) => {
                setOptions(newValue ? [newValue, ...options] : options);
                setValue(newValue);
                if (newValue) {
                    props.onChange({
                        address: formatAddress(newValue.properties),
                        location: {
                            latitude: newValue.geometry.coordinates[1],
                            longitude: newValue.geometry.coordinates[0]
                        }
                    })
                }
                else {
                    props.onChange(null);
                }
            }}
            onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
            }}
            renderInput={(params) => {
                return <TextField value={props.initialValue} {...params} label={t("app.organizations.address")} variant="standard" fullWidth />
            }}
            renderOption={(props, option) => (
                <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                    <LocationOnIcon /> {formatAddress(option.properties)}
                </Box>
            )}
        />
    );
}