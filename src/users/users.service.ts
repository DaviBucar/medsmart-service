import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studyProfile: true,
        preferences: true,
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // 1) Verifica se já existe
    const existing = await this.prisma.userStudyProfile.findUnique({
      where: { userId },
    });

    // 2) Se não existe, cria usando DEFAULT para o studyHabitScore
    if (!existing) {
      return this.prisma.userStudyProfile.create({
        data: {
          user: { connect: { id: userId } },
          weakSubjects: dto.weakSubjects ?? [],
          strongSubjects: dto.strongSubjects ?? [],
          accuracy: dto.accuracy ?? 0,
          xp: dto.xp ?? 0,
          // aqui garantimos number: usa dto ou 0
          studyHabitScore: dto.studyHabitScore ?? 0,
        },
      });
    }

    // 3) Se existe, monta só o que veio no DTO
    const updateData: {
      weakSubjects?: string[];
      strongSubjects?: string[];
      accuracy?: number;
      xp?: number;
      studyHabitScore?: number;
    } = {};

    if (dto.weakSubjects !== undefined) {
      updateData.weakSubjects = dto.weakSubjects;
    }
    if (dto.strongSubjects !== undefined) {
      updateData.strongSubjects = dto.strongSubjects;
    }
    if (dto.accuracy !== undefined) {
      updateData.accuracy = dto.accuracy;
    }
    if (dto.xp !== undefined) {
      updateData.xp = dto.xp;
    }
    if (dto.studyHabitScore !== undefined) {
      updateData.studyHabitScore = dto.studyHabitScore;
    }

    return this.prisma.userStudyProfile.update({
      where: { userId },
      data: updateData,
    });
  }

  async updatePreferences(userId: string, data: UpdatePreferencesDto) {
    const updated = await this.prisma.userPreferences.upsert({
      where: { userId },
      update: { ...data },
      create: {
        ...data,
        user: { connect: { id: userId } },
      },
    });

    return updated;
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        studyProfile: true,
        preferences: true,
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }
}
