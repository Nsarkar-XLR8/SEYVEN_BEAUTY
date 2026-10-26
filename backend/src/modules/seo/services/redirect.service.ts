import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { CreateRedirectDto } from '../dto/create-redirect.dto';
import { QueryRedirectsDto } from '../dto/query-redirects.dto';
import { RedirectResult } from '../interfaces/seo.interface';

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);
  private readonly cacheTtlSeconds = 300; // 5 mins

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Creates or updates a 301/302 URL redirect rule.
   */
  async createRedirect(dto: CreateRedirectDto) {
    const sourcePath = this.normalizePath(dto.sourcePath);
    const targetPath = this.normalizeTargetPath(dto.targetPath);

    if (sourcePath === targetPath) {
      throw new BadRequestException('Source and target path cannot be identical');
    }

    const redirect = await this.prisma.urlRedirect.upsert({
      where: { sourcePath },
      create: {
        sourcePath,
        targetPath,
        statusCode: dto.statusCode ?? 301,
        isActive: dto.isActive ?? true,
      },
      update: {
        targetPath,
        statusCode: dto.statusCode ?? 301,
        isActive: dto.isActive ?? true,
      },
    });

    // Invalidate Redis lookup cache
    await this.redis.del(`seo:redirect:${sourcePath}`);
    this.logger.log(
      `Redirect rule registered: ${sourcePath} -> ${targetPath} (${redirect.statusCode})`,
    );

    return redirect;
  }

  /**
   * Retrieves paginated list of configured redirects.
   */
  async getRedirects(query: QueryRedirectsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      const term = query.search.trim().toLowerCase();
      where.OR = [
        { sourcePath: { contains: term, mode: 'insensitive' } },
        { targetPath: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.urlRedirect.count({ where }),
      this.prisma.urlRedirect.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      items,
    };
  }

  /**
   * Resolves incoming URL against active 301/302 redirect rules with Redis acceleration.
   */
  async resolveRedirect(rawPath: string): Promise<RedirectResult> {
    const normalized = this.normalizePath(rawPath);
    const cacheKey = `seo:redirect:${normalized}`;

    // 1. Check Redis cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Continue to database lookup on cache parse failure
      }
    }

    // 2. Query Prisma database
    const redirect = await this.prisma.urlRedirect.findFirst({
      where: {
        sourcePath: normalized,
        isActive: true,
      },
    });

    if (!redirect) {
      const negativeResult: RedirectResult = {
        found: false,
        sourcePath: normalized,
      };
      await this.redis.set(cacheKey, JSON.stringify(negativeResult), 60);
      return negativeResult;
    }

    // 3. Track hit telemetry asynchronously
    this.prisma.urlRedirect
      .update({
        where: { id: redirect.id },
        data: {
          hitCount: { increment: 1 },
          lastHitAt: new Date(),
        },
      })
      .catch((err: any) => {
        this.logger.warn(`Failed to update hit count for ${normalized}: ${err.message}`);
      });

    const result: RedirectResult = {
      found: true,
      sourcePath: redirect.sourcePath,
      targetPath: redirect.targetPath,
      statusCode: redirect.statusCode,
    };

    await this.redis.set(cacheKey, JSON.stringify(result), this.cacheTtlSeconds);
    return result;
  }

  /**
   * Normalizes path to lowercase, ensures leading slash and strips trailing slash.
   */
  normalizePath(rawPath: string): string {
    if (!rawPath) return '/';
    let path = rawPath.trim().toLowerCase();
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    return path;
  }

  /**
   * Normalizes target path, preserving external URL schemes (https://) or internal paths.
   */
  normalizeTargetPath(target: string): string {
    const trimmed = (target || '').trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return this.normalizePath(trimmed);
  }
}
