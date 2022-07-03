import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, Box, Typography } from "@mui/material";
import * as React from "react";

export default function DataTable(props: any) {
    const { headers, rows, empty, } = props;
    return (
        <TableContainer>
            <Table sx={{ minWidth: 650 }}>
                <TableHead>
                    <TableRow>
                        {headers.map((header: string) => <TableCell>{header}</TableCell>)}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row: any, index: number) => (
                        <TableRow
                            key={index}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            {row.map((item: any) => <TableCell>{item}</TableCell>)}
                        </TableRow>
                    ))}
                    {
                        rows.length == 0 &&
                        <TableRow
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell colSpan={headers.length} align="center">{empty}</TableCell>
                        </TableRow>
                    }
                </TableBody>
            </Table>
        </TableContainer>
    )
}
