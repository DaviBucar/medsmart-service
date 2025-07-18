// v3 (novo)
import { S3Client } from '@aws-sdk/client-s3';

export const S3ClientProvider = {
  provide: 'S3_CLIENT',
  useFactory: () => new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    },
  }),
};
