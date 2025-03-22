import { Route, Get, Tags } from 'tsoa';
import { successResponse } from '../utils/responseWrapper';

@Tags('Health Status')
@Route('health')
export class HealthController {
  @Get('/')
  public async getHealthStatus() {
    return successResponse('OK');
  }
}
