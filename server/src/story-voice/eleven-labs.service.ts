import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);
  private readonly baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(private readonly httpService: HttpService) { }

  async textToSpeech(apiKey: string, voiceId: string, text: string, modelId: string): Promise<Buffer> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/text-to-speech/${voiceId}`,
          { text, model_id: modelId },
          { headers: { 'xi-api-key': apiKey }, responseType: 'arraybuffer' },
        ),
      );
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`ElevenLabs text-to-speech failed: ${error.message}`, error.stack);
      throw new Error(`ElevenLabs API error: ${error.response?.data?.detail?.message || error.message}`);
    }
  }
}
