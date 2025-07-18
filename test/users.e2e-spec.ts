// test/users.e2e-spec.ts
jest.setTimeout(30000);

import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let jwt: string;
  // Gera email único por execução
  const testEmail = `e2e_user_${Date.now()}@test.com`;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    afterAll(async () => {
      await app.close();
    });

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // 1) Registrar usuário e obter JWT
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'E2E User',
        email: testEmail,
        password: 'password123',
      })
      .expect(201);

    jwt = res.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('/users/me (GET) deve retornar dados do usuário autenticado', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${jwt}`)
      .expect(200);

    expect(res.body).toHaveProperty('email', testEmail);
    expect(res.body).toHaveProperty('id');
  });

  it('/users/me/profile (PATCH) deve atualizar perfil do usuário', async () => {
    const payload = {
      weakSubjects: ['Matemática'],
      strongSubjects: ['Física'],
      accuracy: 0.92,
      xp: 150,
      studyHabitScore: 0.85,
    };

    const res = await request(app.getHttpServer())
      .patch('/users/me/profile')
      .set('Authorization', `Bearer ${jwt}`)
      .send(payload)
      .expect(200);

    expect(res.body).toMatchObject(payload);
  });

  it('/users/me/preferences (PATCH) deve atualizar preferências', async () => {
    const payload = {
      preferredStudyMethod: 'flashcards',
      dailyGoal: 10,
      preferredTimeOfDay: 'morning',
    };

    const res = await request(app.getHttpServer())
      .patch('/users/me/preferences')
      .set('Authorization', `Bearer ${jwt}`)
      .send(payload)
      .expect(200);

    expect(res.body).toMatchObject(payload);
  });
});
