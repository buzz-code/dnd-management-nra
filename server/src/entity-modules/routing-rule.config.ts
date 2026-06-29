import { BaseEntityModuleOptions } from '@shared/base-entity/interface';
import { IHeader } from '@shared/utils/exporter/types';
import { RoutingRule } from 'src/db/entities/RoutingRule.entity';

function getConfig(): BaseEntityModuleOptions {
  return {
    entity: RoutingRule,
    query: {
      join: {
        sourceNode: { eager: true },
        targetNode: { eager: true },
        choice: { eager: true },
      },
    },
    exporter: {
      getExportHeaders(): IHeader[] {
        return [
          { value: 'sourceNode.name', label: 'צומת מקור' },
          { value: 'choice.description', label: 'בחירה' },
          { value: 'diceOptions', label: 'אפשרויות קובייה' },
          { value: 'targetNode.name', label: 'צומת יעד' },
        ];
      },
    },
  };
}

export default getConfig();
