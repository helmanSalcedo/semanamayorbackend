import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaAttachmentsController } from './media-attachments.controller';
import { MediaAttachmentsService } from './media-attachments.service';

@Module({
  imports: [MulterModule.register({ storage: memoryStorage() })],
  controllers: [MediaController, MediaAttachmentsController],
  providers: [MediaService, MediaAttachmentsService],
  exports: [MediaAttachmentsService],
})
export class MediaModule {}
