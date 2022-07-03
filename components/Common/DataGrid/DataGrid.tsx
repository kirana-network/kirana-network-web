import * as React from "react";

import { Table, TableHead, TableRow, TableCell, TableBody, Box, TablePagination, Paper, TableContainer } from "@mui/material";
import { useTable, useFilters, useGlobalFilter, useSortBy } from 'react-table'
import { getLoggingInstance } from "../../../core/utils/logger";
import { fuzzyTextFilterFn } from "./Filters/common";
import { DefaultColumnFilter } from "./Filters/DefaultColumnFilter";
import { GlobalFilter } from "./Filters/GlobalFilter";

const logger = getLoggingInstance();

// Our table component
export default function DataGrid({ columns, data, pageSize = 100 }) {
    const filterTypes: any = React.useMemo(
        () => ({
            // Add a new fuzzyTextFilterFn filter type.
            fuzzyText: fuzzyTextFilterFn,
            // Or, override the default text filter to use
            // "startWith"
            text: (rows, id, filterValue) => {
                return rows.filter(row => {
                    const rowValue = row.values[id]
                    return rowValue !== undefined
                        ? String(rowValue)
                            .toLowerCase()
                            .startsWith(String(filterValue).toLowerCase())
                        : true
                })
            },
        }),
        []
    )

    const defaultColumn: any = React.useMemo(
        () => ({
            // Let's set up our default Filter UI
            Filter: DefaultColumnFilter,
        }),
        []
    )

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        state,
        visibleColumns,
        preGlobalFilteredRows,
        setGlobalFilter,
    } = (useTable as any)(
        {
            columns,
            data,
            defaultColumn, // Be sure to pass the defaultColumn option
            filterTypes,
        },
        useFilters, // useFilters!
        useGlobalFilter, // useGlobalFilter!
    ) as any;

    return (
        <>
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: "calc(100vh - 125px)" }}>
                    <Table stickyHeader={true} {...getTableProps()}>
                        <TableHead>
                            {headerGroups.map(headerGroup => (
                                <TableRow {...headerGroup.getHeaderGroupProps()}>
                                    {headerGroup.headers.map(column => (
                                        <TableCell {...column.getHeaderProps()}>
                                            <Box>{column.render('Header')}</Box>
                                            {/* Render the columns filter UI */}
                                            <Box>{column.canFilter ? column.render('Filter') : null}</Box>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                            {false && <TableRow>
                                <TableCell
                                    colSpan={visibleColumns.length}
                                    style={{
                                        textAlign: 'left',
                                    }}
                                >
                                    <GlobalFilter
                                        preGlobalFilteredRows={preGlobalFilteredRows}
                                        globalFilter={state.globalFilter}
                                        setGlobalFilter={setGlobalFilter}
                                    />
                                </TableCell>
                            </TableRow>}
                        </TableHead>
                        <TableBody {...getTableBodyProps()}>
                            {rows.map((row, i) => {
                                prepareRow(row)
                                return (
                                    <TableRow {...row.getRowProps()}>
                                        {row.cells.map(cell => {
                                            const props = cell.getCellProps();
                                            logger.trace("cell134134", { keys: Object.keys(row), id: row.original });
                                            return <TableCell {...cell.getCellProps()}>{cell.render('Cell')}</TableCell>
                                        })}
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </>
    )
}
