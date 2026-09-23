import { Module } from '@nestjs/common';
import { HeritageModule } from '../heritage/heritage.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { ProcessionsController } from './processions.controller';
import { ProcessionsService } from './processions.service';

@Module({
  imports: [HeritageModule],
  controllers: [EventsController, ProcessionsController],
  providers: [EventsService, ProcessionsService],
})
export class OperationsModule {}
