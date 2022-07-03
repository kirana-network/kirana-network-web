import { Box, Typography } from "@mui/material";
import React from "react";
import { useTranslate } from "react-polyglot";
import { SavingState as SavingStates } from "../../core/hooks";

export function SavingState(props: any) {
    const savingState: SavingStates = props.savingState;
    const t = useTranslate();

    return (
        <Box minHeight="30px">
            {savingState && savingState === "SAVING" &&
                <Typography variant="caption">{t("app.common.messages.saving")}</Typography>
            }
            {savingState && savingState === "SAVED" && (
                <Typography variant="caption">{t("app.common.messages.saved")}</Typography>
            )}
        </Box>
    );
}