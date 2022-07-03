import { TextField } from "@mui/material"
import { getLoggingInstance } from "../../../../core/utils/logger";

const logger = getLoggingInstance(DefaultColumnFilter.name);

// Define a default UI for filtering
export function DefaultColumnFilter({
    column: { filterValue, preFilteredRows, setFilter, id },
}) {
    const count = preFilteredRows.length;
    logger.trace("filterValue", { filterValue, id });
    return (
        <TextField
            margin="dense"
            fullWidth
            size="small"
            variant="standard"
            value={filterValue || ''}
            onKeyDown={(key) => {
                if (key.key === "Escape") {
                    setFilter(undefined);
                }
            }}
            onChange={e => setFilter(e.target.value || undefined)}
        />
    )
}
