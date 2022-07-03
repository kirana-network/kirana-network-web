import { TextField } from "@mui/material";
import { useState } from "react";
import { useTranslate } from "react-polyglot";
import { useAsyncDebounce } from "react-table";

// Define a default UI for filtering
export function GlobalFilter({
    preGlobalFilteredRows,
    globalFilter,
    setGlobalFilter,
}) {
    const count = preGlobalFilteredRows.length
    const [value, setValue] = useState(globalFilter)
    const onChange = useAsyncDebounce(value => {
        setGlobalFilter(value || undefined)
    }, 200);
    const t = useTranslate();

    return (
        <span>
            <TextField
                label={t("app.common.search_all")}
                margin="dense"
                size="small"
                fullWidth
                variant="standard"
                value={value || ""}
                onChange={e => {
                    setValue(e.target.value);
                    onChange(e.target.value);
                }}
            />
        </span>
    )
}

