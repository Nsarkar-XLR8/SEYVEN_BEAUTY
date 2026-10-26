import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const streamifier = require('streamifier');

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    const cloudName =
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || 'uoh4c2xb';
    const apiKey =
      this.configService.get<string>('CLOUDINARY_API_KEY') || '529213915192717';
    const apiSecret =
      this.configService.get<string>('CLOUDINARY_API_SECRET') ||
      'y4p0_vLRq-j89fp-fHjBrQC_gaA';

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.logger.log(
      `[Cloudinary] Configured client for Cloud: ${cloudName} (CDN ready)`,
    );
  }

  /**
   * Upload buffer directly to Cloudinary with auto-WebP conversion & responsive optimization
   */
  async uploadImageBuffer(
    buffer: Buffer,
    folder = 'seyven/products',
  ): Promise<{
    url: string;
    publicId: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
  }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          format: 'webp',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
            { max_width: 1600, crop: 'limit' },
          ],
        },
        (error, result?: UploadApiResponse) => {
          if (error) {
            this.logger.error(`Cloudinary upload stream error: ${error.message}`);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Cloudinary upload returned empty response'));
          }
          this.logger.log(
            `[Cloudinary] Uploaded ${result.public_id} (${result.bytes} bytes, format: ${result.format}) -> ${result.secure_url}`,
          );
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        },
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload data URL or remote URL directly to Cloudinary
   */
  async uploadDataUrl(
    dataUrlOrUrl: string,
    folder = 'seyven/products',
  ): Promise<{
    url: string;
    publicId: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
  }> {
    const result = await cloudinary.uploader.upload(dataUrlOrUrl, {
      folder,
      resource_type: 'image',
      format: 'webp',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
        { max_width: 1600, crop: 'limit' },
      ],
    });

    this.logger.log(
      `[Cloudinary] Uploaded data URL ${result.public_id} -> ${result.secure_url}`,
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  }
}
