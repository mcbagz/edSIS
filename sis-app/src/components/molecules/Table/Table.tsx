import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

export interface TableColumn {
  field: string;
  headerName: string;
  width?: number;
  flex?: number;
  sortable?: boolean;
  filterable?: boolean;
  renderCell?: (params: any) => React.ReactNode;
  [key: string]: any;
}

export interface TableProps {
  rows: any[];
  columns: TableColumn[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
  ariaLabel?: string;
  pageSize?: number;
  rowsPerPageOptions?: number[];
  checkboxSelection?: boolean;
  disableRowSelectionOnClick?: boolean;
  autoHeight?: boolean;
  height?: number | string;
}

export function Table({
  rows,
  columns,
  loading = false,
  onRowClick,
  ariaLabel,
  pageSize = 10,
  rowsPerPageOptions = [5, 10, 25, 50],
  checkboxSelection = false,
  disableRowSelectionOnClick = true,
  autoHeight = true,
  height = 400,
}: TableProps) {
  const theme = useTheme();

  const handleRowClick = (params: any) => {
    if (onRowClick) {
      onRowClick(params.row);
    }
  };

  return (
    <Box
      sx={{
        height: autoHeight ? 'auto' : height,
        width: '100%',
        '& .MuiDataGrid-root': {
          border: 'none',
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          '& .MuiDataGrid-cell:focus': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '-1px',
          },
          '& .MuiDataGrid-columnHeader:focus': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '-1px',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
            cursor: onRowClick ? 'pointer' : 'default',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.grey[50],
            borderBottom: `2px solid ${theme.palette.divider}`,
            '& [role="columnheader"]': {
              '&[aria-sort]': {
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: theme.typography.fontWeightMedium,
                },
              },
            },
          },
          '& .MuiDataGrid-virtualScroller': {
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiCheckbox-root': {
            color: theme.palette.primary.main,
          },
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-overlay': {
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
          },
        },
      }}
      role="region"
      aria-label={ariaLabel || 'Data table'}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: pageSize,
            },
          },
        }}
        pageSizeOptions={rowsPerPageOptions}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        autoHeight={autoHeight}
        density="comfortable"
        localeText={{
          MuiTablePagination: {
            labelRowsPerPage: 'Rows per page:',
            labelDisplayedRows: ({ from, to, count }) =>
              `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`,
          },
          noRowsLabel: 'No data available',
          errorOverlayDefaultLabel: 'An error occurred.',
        }}
        slotProps={{
          loadingOverlay: {
            variant: 'linear-progress',
            noRowsVariant: 'skeleton',
          },
        }}
      />
    </Box>
  );
}