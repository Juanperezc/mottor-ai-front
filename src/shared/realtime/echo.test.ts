import { createEcho, subscribeImport } from './echo';

const { listen, channel, leave, ctor } = vi.hoisted(() => ({
  listen: vi.fn(),
  channel: vi.fn(),
  leave: vi.fn(),
  ctor: vi.fn(),
}));

vi.mock('laravel-echo', () => ({
  default: class {
    constructor(options: unknown) {
      ctor(options);
    }
    channel = channel;
    leave = leave;
  },
}));

describe('Echo (FT-08)', () => {
  beforeEach(() => {
    const chain = { listen };
    listen.mockReturnValue(chain);
    channel.mockReturnValue(chain);
  });

  it('configures Reverb from VITE_REVERB_*', () => {
    createEcho({
      VITE_REVERB_APP_KEY: 'mottor-ai-key',
      VITE_REVERB_HOST: 'localhost',
      VITE_REVERB_PORT: '8080',
      VITE_REVERB_SCHEME: 'https',
    } as unknown as ImportMetaEnv);
    expect(ctor).toHaveBeenLastCalledWith(
      expect.objectContaining({
        broadcaster: 'reverb',
        key: 'mottor-ai-key',
        wsHost: 'localhost',
        wsPort: 8080,
        forceTLS: true,
      }),
    );
  });

  it('subscribes to imports.{id} with dot-prefixed broadcastAs names and leaves on cleanup', () => {
    const onBatch = vi.fn();
    const onCompleted = vi.fn();
    const stop = subscribeImport(9, { onBatch, onCompleted });
    expect(channel).toHaveBeenCalledWith('imports.9');
    expect(listen).toHaveBeenCalledWith('.ImportBatchProcessed', onBatch);
    expect(listen).toHaveBeenCalledWith('.ImportCompleted', onCompleted);
    stop();
    expect(leave).toHaveBeenCalledWith('imports.9');
  });
});
