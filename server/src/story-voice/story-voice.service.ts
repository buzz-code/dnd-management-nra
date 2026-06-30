import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import { CrudRequest, Override } from '@dataui/crud';
import { BaseEntityService } from '@shared/base-entity/base-entity.service';
import { InjectEntityRepository } from '@shared/base-entity/interface';
import { MailSendService } from '@shared/utils/mail/mail-send.service';
import { getAsNumber } from '@shared/utils/queryParam.util';
import { generateCommonFileResponse } from '@shared/utils/report/report.util';
import { User } from 'src/db/entities/User.entity';
import { StoryVoice, StoryVoiceStatus } from 'src/db/entities/StoryVoice.entity';
import { ElevenLabsService } from './eleven-labs.service';
import { AudioBufferReportGenerator } from './audio-buffer.generator';

export class StoryVoiceService extends BaseEntityService<StoryVoice> {
  constructor(
    @InjectEntityRepository repo: Repository<StoryVoice>,
    mailSendService: MailSendService,
    private readonly elevenLabsService: ElevenLabsService,
  ) {
    super(repo, mailSendService);
  }

  @Override()
  async createOne(req: CrudRequest<any>, dto: DeepPartial<StoryVoice>): Promise<StoryVoice> {
    const created = await super.createOne(req, dto);
    return this.generateAudio(created);
  }

  @Override()
  async deleteOne(req: CrudRequest): Promise<void | StoryVoice> {
    const entity = await this.getOneOrFail(req);
    if (entity.filePath) {
      await fs.unlink(entity.filePath).catch(() => { });
    }
    return super.deleteOne(req);
  }

  async doAction(req: CrudRequest<any, any>, body: any): Promise<any> {
    switch (req.parsed.extra.action) {
      case 'download': {
        return this.downloadAudio(getAsNumber(req.parsed.extra.id));
      }
    }
    return super.doAction(req, body);
  }

  private async generateAudio(entity: StoryVoice): Promise<StoryVoice> {
    try {
      const apiKey = await this.getUserElevenLabsApiKey(entity.userId);
      if (!apiKey) {
        throw new Error('ElevenLabs API key not configured. Add it in Settings.');
      }
      const segments = Array.isArray(entity.segments) ? entity.segments : [];
      if (!segments.length) {
        throw new Error('No segments provided.');
      }

      const buffers: Buffer[] = [];
      for (const segment of segments) {
        const voiceId = entity.characterVoices?.[segment.character];
        if (!voiceId) {
          throw new Error(`No voice selected for character "${segment.character}".`);
        }
        buffers.push(
          await this.elevenLabsService.textToSpeech(apiKey, voiceId, segment.text, entity.modelId),
        );
      }

      const buffer = Buffer.concat(buffers);
      const filePath = path.join(os.tmpdir(), `story-voice-${entity.id}-${randomUUID()}.mp3`);
      await fs.writeFile(filePath, buffer);

      await this.repo.update(entity.id, { filePath, status: StoryVoiceStatus.Completed, errorMessage: null });
      return { ...entity, filePath, status: StoryVoiceStatus.Completed, errorMessage: null };
    } catch (error) {
      await this.repo.update(entity.id, { status: StoryVoiceStatus.Failed, errorMessage: error.message });
      return { ...entity, status: StoryVoiceStatus.Failed, errorMessage: error.message };
    }
  }

  private async downloadAudio(id: number) {
    if (!id) {
      throw new BadRequestException('Missing id');
    }
    const entity = await this.repo.findOneByOrFail({ id });
    if (!entity.filePath) {
      throw new BadRequestException('Audio not generated yet for this record.');
    }
    const buffer = await fs.readFile(entity.filePath);
    return generateCommonFileResponse(
      new AudioBufferReportGenerator(() => entity.name),
      { buffer },
      this.dataSource,
    );
  }

  private async getUserElevenLabsApiKey(userId: number): Promise<string | null> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      select: ['id', 'additionalData'],
    });
    return user?.additionalData?.elevenLabsApiKey ?? null;
  }
}
