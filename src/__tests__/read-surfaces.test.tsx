import { fireEvent, render, screen } from '@testing-library/react';
import {
  DecisionBand,
  OperatorTable,
  QueueSection,
  StatePanel,
} from '../read-surfaces';
import { MetricTile, TelemetryValue } from '../telemetry';

describe('read-surface primitives', () => {
  it('keeps a queue row keyboard-operable', () => {
    const onOpen = jest.fn();
    render(<OperatorTable columns={[{ id: 'title', header: 'Work', cell: item => item.title }]} items={[{ id: 'one', title: 'Inspect me' }]} getRowId={item => item.id} onRowOpen={onOpen} />);
    fireEvent.keyDown(screen.getByText('Inspect me').closest('tr')!, { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('does not enable keep until the decision reason is meaningful', () => {
    const onValueChange = jest.fn();
    render(<DecisionBand value="  " onValueChange={onValueChange} onKeep={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Keep' })).toBeDisabled();
  });

  it('distinguishes unavailable telemetry from a numeric zero', () => {
    render(<><TelemetryValue value={0} /><TelemetryValue value={0} state="unavailable" /><StatePanel state="partial" /><MetricTile label="Runs" value={0} /></>);
    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Partial data')).toBeInTheDocument();
  });

  it('announces unavailable queue contents instead of an empty list', () => {
    render(<QueueSection title="Docket" state="unavailable" />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });
});
