import { BaseEntityModuleOptions } from '@shared/base-entity/interface';
import { IHeader } from '@shared/utils/exporter/types';
import { Character } from 'src/db/entities/Character.entity';

function getConfig(): BaseEntityModuleOptions {
  return {
    entity: Character,
    query: {},
    exporter: {
      getExportHeaders(): IHeader[] {
        return [
          { value: 'gameId', label: 'משחק' },
          { value: 'name', label: 'שם' },
          { value: 'voiceId', label: 'קול' },
        ];
      },
    },
  };
}

export default getConfig();
