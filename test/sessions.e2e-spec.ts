// test/sessions.e2e-spec.ts
jest.setTimeout(30000);

import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { AiService } from '../src/ai/ai.service';

describe('SessionsController (e2e)', () => {
  let app: INestApplication;
  let jwt: string;
  const testEmail = `e2e_session_${Date.now()}@test.com`;
  const fakeFeedback = 'E2E feedback text';

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      // evita chamada real ao DeepSeek
      .overrideProvider(AiService)
      .useValue({ generateSessionFeedback: jest.fn().mockResolvedValue(fakeFeedback) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'E2E Session',
        email: testEmail,
        password: 'password123',
      })
      .expect(201);

    jwt = res.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('/sessions/start → PATCH /sessions/end → GET /sessions/me/history', async () => {
    // 2) Iniciar sessão
    const startRes = await request(app.getHttpServer())
      .post('/sessions/start')
      .set('Authorization', `Bearer ${jwt}`)
      .send({ topics: ['Topic1', 'Topic2'] })
      .expect(201);
    expect(startRes.body).toHaveProperty('id');
    const sessionId = startRes.body.id;

    // 3) Finalizar sessão (IA mockada)
    const endRes = await request(app.getHttpServer())
      .patch(`/sessions/end/${sessionId}`)
      .set('Authorization', `Bearer ${jwt}`)
      .send({ score: 2, mistakes: 1, aiSummary: '' })
      .expect(200);
    expect(endRes.body.aiSummary).toBe(fakeFeedback);

    // 4) Obter histórico
    const histRes = await request(app.getHttpServer())
      .get('/sessions/me/history')
      .set('Authorization', `Bearer ${jwt}`)
      .expect(200);
    expect(Array.isArray(histRes.body)).toBe(true);
    expect(histRes.body.find(s => s.id === sessionId)).toBeDefined();
  });
});
