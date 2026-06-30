import { BaseEntityModuleOptions } from '@shared/base-entity/interface';
import { IHeader } from '@shared/utils/exporter/types';
import { StoryVoice } from 'src/db/entities/StoryVoice.entity';
import { ElevenLabsService } from 'src/story-voice/eleven-labs.service';
import { StoryVoiceService } from 'src/story-voice/story-voice.service';

function getConfig(): BaseEntityModuleOptions {
  return {
    entity: StoryVoice,
    service: StoryVoiceService,
    providers: [ElevenLabsService],
    exporter: {
      getExportHeaders(): IHeader[] {
        return [
          { value: 'name', label: 'שם' },
          { value: 'status', label: 'סטטוס' },
          { value: 'modelId', label: 'מודל' },
        ];
      },
    },
  };
}

export default getConfig();
