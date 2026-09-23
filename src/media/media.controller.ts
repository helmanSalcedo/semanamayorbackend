import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaService } from './media.service';

// Hard ceiling independent of MEDIA_MAX_FILE_SIZE_MB: uploads are buffered in
// memory (see MediaModule), so this bounds worst-case memory use regardless
// of how the business limit is configured.
const ABSOLUTE_MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @Permissions('media_asset.manage')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: ABSOLUTE_MAX_UPLOAD_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        festivalEditionId: {
          type: 'string',
          format: 'uuid',
          description:
            'Opcional — ordena el storage como festivals/{slug}/{año}/...',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary: 'Sube un archivo (imagen, video, audio o PDF) a Firebase Storage',
  })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mediaService.upload(file, user.sub, dto.festivalEditionId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Devuelve los metadatos de un archivo (contenido público)',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mediaService.findById(id);
  }

  @Delete(':id')
  @Permissions('media_asset.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Elimina un archivo (soft-delete + borrado del storage)',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.mediaService.remove(id);
  }
}
