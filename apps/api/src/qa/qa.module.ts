
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import { SearchModule } from '../search/search.module';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';
import { OPENAI_CLIENT } from './qa.constants';

@Module({
  imports: [SearchModule],
  controllers: [QaController],
  providers: [
    QaService,
    {
      provide: OPENAI_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): OpenAI | null => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');

        return apiKey ? new OpenAI({ apiKey }) : null;
      },
    },
  ],
})
export class QaModule {}
