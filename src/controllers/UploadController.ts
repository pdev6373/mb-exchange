import { Route, Post, Tags, FormField, UploadedFile } from 'tsoa';
import cloudinary from '../utils/cloudinary';
import { successResponse } from '../utils/responseWrapper';
import { BadRequestError, NotFoundError } from '../utils/customErrors';
import { UploadApiResponse } from 'cloudinary';

@Tags('Upload Files')
@Route('upload')
export class UploadController {
  @Post('/')
  public async uploadImage(
    @FormField() description?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new NotFoundError('No file uploaded');

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'uploads',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result)
            return reject(new BadRequestError('Failed to upload image'));
          resolve(result);
        },
      );
      stream.end(file.buffer);
    });

    return successResponse('Upload successful', {
      url: result.secure_url,
      publicId: result.public_id,
      description: description || '',
    });
  }
}
