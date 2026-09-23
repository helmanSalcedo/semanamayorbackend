import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { StorageService } from './storage.service';

jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(() => ({ name: 'mock-app' })),
  cert: jest.fn((opts: unknown) => opts),
}));

const mockFile = {
  save: jest.fn().mockResolvedValue(undefined),
  makePublic: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
};
const mockBucket = { file: jest.fn(() => mockFile) };

jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn(() => ({ bucket: jest.fn(() => mockBucket) })),
}));

function buildConfigService(firebase?: unknown): ConfigService {
  return {
    get: () => ({ storage: { maxFileSizeMb: 50, firebase } }),
  } as unknown as ConfigService;
}

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('without Firebase configured', () => {
    it('throws on upload', async () => {
      const service = new StorageService(buildConfigService(undefined));
      await expect(
        service.upload(Buffer.from('x'), 'a/b', 'image/png'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('throws on delete', async () => {
      const service = new StorageService(buildConfigService(undefined));
      await expect(service.delete('a/b')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('with Firebase configured', () => {
    const firebase = {
      projectId: 'demo',
      clientEmail: 'sa@demo.iam.gserviceaccount.com',
      privateKey:
        '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
      storageBucket: 'demo.appspot.com',
    };

    it('uploads a buffer and makes it public, returning a googleapis URL', async () => {
      const service = new StorageService(buildConfigService(firebase));
      const result = await service.upload(
        Buffer.from('hello'),
        'media/x.png',
        'image/png',
      );

      expect(mockBucket.file).toHaveBeenCalledWith('media/x.png');
      expect(mockFile.save).toHaveBeenCalledWith(
        Buffer.from('hello'),
        expect.objectContaining({ metadata: { contentType: 'image/png' } }),
      );
      expect(mockFile.makePublic).toHaveBeenCalled();
      expect(result).toEqual({
        url: 'https://storage.googleapis.com/demo.appspot.com/media/x.png',
        storageKey: 'media/x.png',
      });
    });

    it('deletes a file by storage key', async () => {
      const service = new StorageService(buildConfigService(firebase));
      await service.delete('media/x.png');
      expect(mockBucket.file).toHaveBeenCalledWith('media/x.png');
      expect(mockFile.delete).toHaveBeenCalledWith({ ignoreNotFound: true });
    });
  });
});
