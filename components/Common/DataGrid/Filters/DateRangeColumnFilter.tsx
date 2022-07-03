import { CalendarToday, Close, EightKSharp } from "@mui/icons-material";
import { Box, Stack, Typography, IconButton, Popover } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { useState, useEffect } from "react";
import { DateRangePicker, Range } from "react-date-range";
import { useTranslate } from "react-polyglot";
import { getLoggingInstance } from "../../../../core/utils/logger";

const logger = getLoggingInstance(DateRangeColumnFilter.name);

export function DateRangeColumnFilterFn(rows, id, filterValue) {
    return rows.filter(row => {
        const rowValue = dayjs(row.values[id]).toDate().getTime();
        return !filterValue.length || (
            rowValue >= filterValue[0] && rowValue <= filterValue[1]
        );
    })
}
// DateRangeColumnFilterFn.autoRemove = (val) => typeof val !== "number";

// Define a default UI for filtering
export function DateRangeColumnFilter({
    column: { filter, filterValue, preFilteredRows, setFilter, id },
}) {
    const onChange = (range) => {
        logger.trace("range", { range, filterValue, filter, id });
        if (range.startDate && range.endDate) {
            const values = [dayjs(range.startDate).toDate().getTime(), dayjs(range.endDate).toDate().getTime()];
            logger.trace("values", {
                values
            })
            setFilter(values)
        }
        else {
            setFilter([])
        }
    }
    return (
        <DateRangeSelector onChange={onChange} />
    )
}


export function DateRangeSelector(props: any) {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement>();
    const t = useTranslate();
    const [selectionRange, setSelectionRange] = useState<Range>({
        startDate: null,
        endDate: null,
        key: 'selection',
    });
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    useEffect(() => {
        props.onChange(selectionRange);
    }, [selectionRange]);

    return (
        <Box>
            <Stack direction="row" sx={{ marginTop: "24px !important" }}>
                {
                    selectionRange.startDate &&
                    <Typography>{dayjs(selectionRange.startDate).format("YYYY-MM-DD")} - {dayjs(selectionRange.endDate).format("YYYY-MM-DD")}</Typography>}
                {
                    !selectionRange.startDate &&
                    <Typography>{t("app.common.select_date_range")}</Typography>}
                <IconButton sx={{ marginTop: "-10px !important" }} onClick={handleClick}>
                    <CalendarToday />
                </IconButton>
                <IconButton sx={{ marginTop: "-10px !important" }} onClick={() => setSelectionRange({ startDate: null, endDate: null, key: "selection" })}>
                    <Close />
                </IconButton>
            </Stack>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <DateRangePicker
                    ranges={[selectionRange]}
                    onChange={(val) => {
                        setSelectionRange(val['selection']);
                        handleClose();
                    }}
                />

            </Popover>
        </Box>
    );

}