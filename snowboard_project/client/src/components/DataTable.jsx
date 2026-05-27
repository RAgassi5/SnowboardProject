import React from 'react';

/**
 * DataTable — reusable dynamic table component.
 *
 * Props:
 *   columns  [{key, label, render?}]  — column definitions
 *   data     [object]                 — array of row objects
 *   emptyMessage  string              — shown when data is empty
 *   id       string                  — optional table id
 */
function DataTable({ columns = [], data = [], emptyMessage = 'No data available.', id }) {
  if (data.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📋</span>
        <h3>No data</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table" id={id} aria-label="Data table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={row.id ?? row.resortId ?? row.userId ?? row.tripId ?? rowIdx}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={col.key === 'name' ? 'td-name' : ''}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
