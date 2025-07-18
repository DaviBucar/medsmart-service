// src/common/s3.module.ts
import { Module, Provider } from '@nestjs/common';
import { S3 } from 'aws-sdk';

export const S3ClientProvider: Provider = {
  provide: 'S3_CLIENT',
  useFactory: () => {
    return new S3({
      region: process.env.AWS_REGION,
      endpoint: process.env.S3_ENDPOINT,     
      s3ForcePathStyle: true,                 
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
    });
  },
};

@Module({
  providers: [S3ClientProvider],
  exports: [S3ClientProvider],
})
export class S3Module {}
