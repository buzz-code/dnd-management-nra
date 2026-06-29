import { BaseEntityModuleOptions } from '@shared/base-entity/interface';
import { IHeader } from '@shared/utils/exporter/types';
import { Segment } from 'src/db/entities/Segment.entity';

function getConfig(): BaseEntityModuleOptions {
  return {
    entity: Segment,
    query: {},
    exporter: {
      getExportHeaders(): IHeader[] {
        return [
          { value: 'name', label: 'שם' },
          { value: 'title', label: 'תווית' },
          { value: 'value', label: 'טקסט' },
          { value: 'filepath', label: 'נתיב קובץ' },
        ];
      },
    },
  };
}

export default getConfig();
