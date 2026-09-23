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

  async upload(
    buffer: Buffer,
    path: string,
    contentType: string,
  ): Promise<UploadResult> {
    if (!this.bucket) {
      throw new InternalServerErrorException(
        'Firebase Storage no está configurado',
      );
    }

    const file = this.bucket.file(path);
    await file.save(buffer, { metadata: { contentType }, resumable: false });
    await file.makePublic();

    return {
      url: `https://storage.googleapis.com/${this.bucketName}/${path}`,
      storageKey: path,
    };
  }

  async delete(storageKey: string): Promise<void> {
    if (!this.bucket) {
      throw new InternalServerErrorException(
        'Firebase Storage no está configurado',
      );
    }
    await this.bucket.file(storageKey).delete({ ignoreNotFound: true });
  }
}
