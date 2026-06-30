import { BaseReportGenerator } from '@shared/utils/report/report.generators';
import { CommonFileFormat } from '@shared/utils/report/types';

export class AudioBufferReportGenerator extends BaseReportGenerator<{ buffer: Buffer }, { buffer: Buffer }> {
  fileFormat: CommonFileFormat = CommonFileFormat.Mp3;

  constructor(getReportName: () => string) {
    super(getReportName, async (params) => params);
  }

  async getFileBuffer(data: { buffer: Buffer }): Promise<Buffer> {
    return data.buffer;
  }
}
