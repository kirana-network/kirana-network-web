import { deepOrange, blueGrey, } from "@mui/material/colors";
import { createTheme, PaletteMode, ThemeOptions } from "@mui/material";
import { getLoggingInstance } from "./core/utils/logger";

// A custom theme for this app
const darkTheme = {
    palette: {
        mode: "dark",
        primary: deepOrange
    }
} as ThemeOptions;

const lightTheme = {
    palette: {
        // primary: blueGrey,
        // secondary: deepOrange
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: { color: "black", backgroundColor: "white" }
            }
        }
    }
} as ThemeOptions;

const commonTheme = {};

function getThemeDefinition(mode): ThemeOptions {
    switch (mode) {
        case "dark":
            return Object.assign({}, commonTheme, darkTheme);
        case "light":
        default:
            return Object.assign({}, commonTheme, lightTheme);
    }
}

export default function getTheme(mode: PaletteMode) {
    const logger = getLoggingInstance(getTheme.name);
    // TODO: better light mode theme that matches the landing page imagery
    const definition = getThemeDefinition("dark"); 
    logger.trace("info", { mode });
    return createTheme(definition);
}