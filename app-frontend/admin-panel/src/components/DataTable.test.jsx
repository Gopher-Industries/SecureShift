import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from './DataTable';

const columns = [{ key: 'name', header: 'Name' }];
const rows = [
  { _id: '1', name: 'Alice' },
  { _id: '2', name: 'Bob' },
  { _id: '3', name: 'Cara' },
];

describe('DataTable bulk actions / multi-select', () => {
  it('renders no selection UI when selectable is not set', () => {
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.queryByLabelText(/select all/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/select row/i)).not.toBeInTheDocument();
  });

  it('selecting a row reveals the bulk bar and passes the row to the action', async () => {
    const onExport = jest.fn();
    render(
      <DataTable
        columns={columns}
        rows={rows}
        selectable
        bulkActions={[{ key: 'export', label: 'Export', onClick: onExport, clearAfter: false }]}
      />
    );

    await userEvent.click(screen.getByLabelText('Select row 1'));
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    const toolbar = screen.getByRole('toolbar', { name: 'Bulk actions' });

    await userEvent.click(within(toolbar).getByRole('button', { name: 'Export' }));
    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledWith([{ _id: '1', name: 'Alice' }]);
  });

  it('select-all selects every row on the page', async () => {
    render(<DataTable columns={columns} rows={rows} selectable bulkActions={[]} />);
    await userEvent.click(screen.getByLabelText('Select all rows on this page'));
    expect(screen.getByText('3 selected')).toBeInTheDocument();
  });

  it('shows an indeterminate select-all when only some rows are selected', async () => {
    render(<DataTable columns={columns} rows={rows} selectable bulkActions={[]} />);
    await userEvent.click(screen.getByLabelText('Select row 1'));
    const selectAll = screen.getByLabelText('Select all rows on this page');
    expect(selectAll.indeterminate).toBe(true);
    expect(selectAll.checked).toBe(false);
  });

  it('calls onSelectionChange with the selected rows', async () => {
    const onSelectionChange = jest.fn();
    render(
      <DataTable columns={columns} rows={rows} selectable onSelectionChange={onSelectionChange} />
    );
    await userEvent.click(screen.getByLabelText('Select row 2'));
    expect(onSelectionChange).toHaveBeenLastCalledWith([{ _id: '2', name: 'Bob' }]);
  });

  it('Clear resets the selection', async () => {
    render(<DataTable columns={columns} rows={rows} selectable bulkActions={[]} />);
    await userEvent.click(screen.getByLabelText('Select all rows on this page'));
    expect(screen.getByText('3 selected')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
  });
});
