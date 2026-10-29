import { render, screen } from '@testing-library/react';
import { ImportBatchStatus } from './ImportBatchStatus';
import type { FileImport } from './useImportStore';

describe('ImportBatchStatus message display', () => {
  it('translates an API message on the file status card', () => {
    const file: FileImport = {
      id: 1,
      name: 'dataset.json',
      total: 0,
      batches: [],
      status: 'failed',
      error: 'The given data was invalid.',
      importId: null,
      imported: 0,
      failedBatches: 0,
      transport: null,
      startedAt: null,
      finishedAt: Date.now(),
    };

    render(
      <ImportBatchStatus
        file={file}
        mode="queue"
        canResume={false}
        onShowErrors={vi.fn()}
        onResume={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Los datos enviados no son válidos.');
  });
});
