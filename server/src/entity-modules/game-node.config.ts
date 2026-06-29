import { BaseEntityModuleOptions } from '@shared/base-entity/interface';
import { IHeader } from '@shared/utils/exporter/types';
import { GameNode } from 'src/db/entities/GameNode.entity';

function getConfig(): BaseEntityModuleOptions {
  return {
    entity: GameNode,
    query: {
      join: {
        layer: { eager: true },
        segment: { eager: true },
      },
    },
    exporter: {
      getExportHeaders(): IHeader[] {
        return [
          { value: 'name', label: 'שם' },
          { value: 'nodeType', label: 'סוג צומת' },
          { value: 'layer.name', label: 'שכבה' },
          { value: 'segment.name', label: 'קטע' },
        ];
      },
    },
  };
}

export default getConfig();
