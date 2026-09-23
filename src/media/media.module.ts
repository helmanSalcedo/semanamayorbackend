import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaAttachmentsController } from './media-attachments.controller';
import { MediaAttachmentsService } from './media-attachments.service';
import { GalleriesController } from './galleries.controller';
import { GalleriesService } from './galleries.service';
import { GalleryItemsController } from './gallery-items.controller';
import { GalleryItemsService } from './gallery-items.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [MulterModule.register({ storage: memoryStorage() })],
  controllers: [
    MediaController,
    MediaAttachmentsController,
    GalleriesController,
    GalleryItemsController,
    DocumentsController,
  ],
  providers: [
    MediaService,
    MediaAttachmentsService,
    GalleriesService,
    GalleryItemsService,
    DocumentsService,
  ],
  exports: [MediaAttachmentsService],
})
export class MediaModule {}
