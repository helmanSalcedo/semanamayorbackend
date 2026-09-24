import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage, type Storage } from 'firebase-admin/storage';
import type { AppConfig } from '../config/configuration';

type Bucket = ReturnType<Storage['bucket']>;

export interface UploadResult {
  url: string;
  storageKey: string;
}

export interface UploadOptions {
  /**
   * Defaults to true. Private files (e.g. donation receipts, which carry
   * donor PII) get a non-public gs:// URL and must be served through an
   * authenticated endpoint via download().
   */
  public?: boolean;
}

/**
 * Thin wrapper around the Firebase Admin Storage SDK. Files are made public
 * on upload — this platform's media (procession photos, historical
 * documents) is meant for public diffusion, not gated content.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private bucket: Bucket | null = null;
  private readonly bucketName?: string;

  constructor(configService: ConfigService) {
    const { firebase } = configService.get<AppConfig>('app')!.storage;
    if (!firebase) {
      this.logger.warn(
        'Firebase Storage no configurado: las subidas de media fallarán hasta que se configure',
      );
      return;
    }

    this.bucketName = firebase.storageBucket;
    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: firebase.projectId,
          clientEmail: firebase.clientEmail,
          privateKey: firebase.privateKey,
        }),
        storageBucket: firebase.storageBucket,
      });
    this.bucket = getStorage(app).bucket();
  }

  get isConfigured(): boolean {
    return this.bucket !== null;
  }

  async upload(
    buffer: Buffer,
    path: string,
    contentType: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    const bucket = this.requireBucket();
    const isPublic = options.public ?? true;

    const file = bucket.file(path);
    await file.save(buffer, { metadata: { contentType }, resumable: false });
    if (!isPublic) {
      return { url: `gs://${this.bucketName}/${path}`, storageKey: path };
    }
    await file.makePublic();

    return {
      url: `https://storage.googleapis.com/${this.bucketName}/${path}`,
      storageKey: path,
    };
  }

  async download(storageKey: string): Promise<Buffer> {
    const [contents] = await this.requireBucket().file(storageKey).download();
    return contents;
  }

  async delete(storageKey: string): Promise<void> {
    await this.requireBucket()
      .file(storageKey)
      .delete({ ignoreNotFound: true });
  }

  private requireBucket(): Bucket {
    if (!this.bucket) {
      throw new InternalServerErrorException(
        'Firebase Storage no está configurado',
      );
    }
    return this.bucket;
  }
}
