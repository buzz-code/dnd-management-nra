import { Module } from '@nestjs/common';
import { BaseEntityModule } from '@shared/base-entity/base-entity.module';
import { createSharedEntitiesImports } from '@shared/entities/createSharedEntitiesImports';
import userConfig from '@shared/entities/configs/user.config';
import { createAuditLogConfig } from '@shared/entities/configs/audit-log.config';
import { registerEntityNameMap } from '@shared/entities/configs/import-file.config';
import phoneTemplateConfig from '@shared/entities/configs/phone-template.config';
import phoneCampaignConfig from '@shared/entities/configs/phone-campaign.config';

import { Segment } from './db/entities/Segment.entity';
import { Layer } from './db/entities/Layer.entity';

import segmentConfig from './entity-modules/segment.config';
import layerConfig from './entity-modules/layer.config';
import gameNodeConfig from './entity-modules/game-node.config';
import choiceConfig from './entity-modules/choice.config';
import routingRuleConfig from './entity-modules/routing-rule.config';

registerEntityNameMap({
  segment: 'קטעים',
  layer: 'שכבות',
  node: 'צמתים',
  choice: 'בחירות',
  routing_rule: 'כללי ניתוב',
});

@Module({
  imports: [
    ...createSharedEntitiesImports(userConfig),

    // DnD domain entities
    BaseEntityModule.register(segmentConfig),
    BaseEntityModule.register(layerConfig),
    BaseEntityModule.register(gameNodeConfig),
    BaseEntityModule.register(choiceConfig),
    BaseEntityModule.register(routingRuleConfig),

    // Phone system
    BaseEntityModule.register(phoneTemplateConfig),
    BaseEntityModule.register(phoneCampaignConfig),

    // Audit log
    BaseEntityModule.register(
      createAuditLogConfig({
        segment: Segment,
        layer: Layer,
      }),
    ),
  ],
})
export class EntitiesModule {}
