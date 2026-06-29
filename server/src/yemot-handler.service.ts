import { Injectable } from '@nestjs/common';
import { BaseYemotHandlerService } from '../shared/utils/yemot/v2/yemot-router.service';

@Injectable()
export class YemotHandlerService extends BaseYemotHandlerService {
  override async processCall(): Promise<void> {
    this.logger.log(`Processing call with ID: ${this.call.callId}`);
    await this.getUserByDidPhone();

    if (this.user.additionalData?.maintainanceMessage) {
      return this.hangupWithMessage(this.user.additionalData.maintainanceMessage);
    }

    // TODO: implement DnD phone flow
    return this.hangupWithMessage('שלום, המערכת בפיתוח');
  }
}
