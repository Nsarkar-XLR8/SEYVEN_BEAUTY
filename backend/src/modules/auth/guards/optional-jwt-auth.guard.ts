import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { AuthenticatedRequest } from './jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = await this.tokenService.verifyAccessToken(token);
        request.user = {
          id: payload.sub,
          userId: payload.sub,
          phone: payload.phone,
          role: payload.role,
          jti: payload.jti,
        };
      } catch {
        // Continue as guest if token is invalid or expired
      }
    }

    return true;
  }
}
