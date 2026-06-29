import { BaseEntityModuleOptions } from '@shared/base-entity/interface';
import { IHeader } from '@shared/utils/exporter/types';
import { Game } from 'src/db/entities/Game.entity';

function getConfig(): BaseEntityModuleOptions {
  return {
    entity: Game,
    query: {},
    exporter: {
      getExportHeaders(): IHeader[] {
        return [
          { value: 'title', label: 'שם' },
          { value: 'isActive', label: 'פעיל' },
        ];
      },
    },
  };
}

export default getConfig();
