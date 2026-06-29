import { BaseEntityModuleOptions } from '@shared/base-entity/interface';
import { IHeader } from '@shared/utils/exporter/types';
import { Choice } from 'src/db/entities/Choice.entity';

function getConfig(): BaseEntityModuleOptions {
  return {
    entity: Choice,
    query: {
      join: {
        node: { eager: true },
      },
    },
    exporter: {
      getExportHeaders(): IHeader[] {
        return [
          { value: 'node.name', label: 'צומת' },
          { value: 'inputKey', label: 'מקש' },
          { value: 'description', label: 'תיאור' },
        ];
      },
    },
  };
}

export default getConfig();
