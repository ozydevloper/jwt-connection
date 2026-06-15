import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Users } from '@prisma/client';
import type { Request } from 'express';

type RequestWithUser = Request & { user: Users };

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
