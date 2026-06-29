import { BaseEntityModuleOptions } from '@shared/base-entity/interface';
import { IHeader } from '@shared/utils/exporter/types';
import { Layer } from 'src/db/entities/Layer.entity';

function getConfig(): BaseEntityModuleOptions {
  return {
    entity: Layer,
    query: {},
    exporter: {
      getExportHeaders(): IHeader[] {
        return [
          { value: 'name', label: 'שם' },
          { value: 'layerType', label: 'סוג שכבה' },
        ];
      },
    },
  };
}

export default getConfig();
