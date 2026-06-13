import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Users } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(where: Prisma.UsersWhereUniqueInput): Promise<Users | null> {
    return this.prisma.users.findUnique({ where });
  }

  async findAll(where?: Prisma.UsersWhereInput) {
    return this.prisma.users.findMany({ where });
  }

  async create(data: Prisma.UsersCreateInput): Promise<Users | null> {
    return this.prisma.users.create({ data });
  }

  async update(
    where: Prisma.UsersWhereUniqueInput,
    data: Prisma.UsersUpdateInput,
  ): Promise<Users | null> {
    return this.prisma.users.update({ where, data });
  }

  async delete(where: Prisma.UsersWhereUniqueInput): Promise<Users | null> {
    return this.prisma.users.delete({ where });
  }
}
