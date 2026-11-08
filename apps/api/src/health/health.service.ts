import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  checkHealth() {
    return {
      status: 'success',
      message: 'KnowledgeHub API is running',
      application: 'KnowledgeHub',
      timestamp: new Date().toISOString(),
    };
  }
}
