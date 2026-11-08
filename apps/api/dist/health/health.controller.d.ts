import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    checkHealth(): {
        status: string;
        message: string;
        application: string;
        timestamp: string;
    };
}
