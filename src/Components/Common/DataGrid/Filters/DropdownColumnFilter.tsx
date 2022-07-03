import { FormControl, Select, MenuItem } from "@mui/material";
import { useState } from "react";
import { useTranslate } from "react-polyglot";
import { getLoggingInstance } from "../../../../core/utils/logger";

const logger = getLoggingInstance(DropdownColumnFilter.name);

export function DropdownColumnFilterFn(rows, id, filterValue) {
    return rows.filter(row => {
        const rowValue = row.values[id];
        return !filterValue || rowValue == filterValue;
    })
}

// Define a default UI for filtering
export function DropdownColumnFilter({
    column: { filterValue, preFilteredRows, setFilter, Header, options },
}) {
    const count = preFilteredRows.length;
    const t = useTranslate();
    logger.trace("options", { options, filterValue });

    return (
        <FormControl>
            {/* <InputLabel>{Header}</InputLabel> */}
            <Select
                fullWidth={false}
                style={{ width: 201 }}
                variant="standard"
                value={filterValue}
                onChange={(event) => setFilter(event.target.value)}
            >
                <MenuItem value={undefined}><em>{t("app.common.all")}</em></MenuItem>
                {
                    options?.map(option => <MenuItem value={option.id}>{`${option.label}`}</MenuItem>)
                }
            </Select>
        </FormControl>
    )
}
