import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import path from 'path';
import https from 'https';
import fs from 'fs';
import { lifecycleService } from './services/lifecycle-service';
import { upgradePlannerService } from './services/upgrade-planner';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 9000;
const PLUGIN_PORT = 9443;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(
  pinoHttp({
    logger,
    autoLogging: true,
  })
);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes

/**
 * Get platform status (cluster + all operators)
 */
app.get('/api/v1/platform/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await lifecycleService.getPlatformStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

/**
 * Get status for a specific operator
 */
app.get('/api/v1/operators/:namespace/:name', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { namespace, name } = req.params;
    const status = await lifecycleService.getOperatorStatus(name, namespace);

    if (!status) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    res.json(status);
  } catch (error) {
    return next(error);
  }
});

/**
 * Get lifecycle information for an operator version
 */
app.get(
  '/api/v1/lifecycle/:operatorName/:version',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { operatorName, version } = req.params;
      const lifecycleInfo = await lifecycleService.getOperatorLifecycleInfo(operatorName, version);
      res.json(lifecycleInfo);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get upgrade recommendations
 */
app.get('/api/v1/upgrade/recommendations', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const recommendations = await upgradePlannerService.getUpgradeRecommendations();
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
});

/**
 * Get specific upgrade path by ID
 */
app.get('/api/v1/upgrade/paths/:pathId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pathId } = req.params;
    const recommendations = await upgradePlannerService.getUpgradeRecommendations();
    const path = recommendations.recommendedPaths.find((p) => p.id === pathId);

    if (!path) {
      return res.status(404).json({ error: 'Upgrade path not found' });
    }

    res.json(path);
  } catch (error) {
    return next(error);
  }
});

/**
 * Get maintenance window recommendations
 */
app.get('/api/v1/upgrade/maintenance-windows', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const recommendations = await upgradePlannerService.getUpgradeRecommendations();
    res.json(recommendations.maintenanceWindows);
  } catch (error) {
    next(error);
  }
});

// Serve static plugin files - must come before error handlers
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Error handling middleware
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ error }, 'Unhandled error');
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

// 404 handler - must be last
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Start unified server with HTTPS
const certPath = '/var/serving-cert/tls.crt';
const keyPath = '/var/serving-cert/tls.key';

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const httpsOptions = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };

  https.createServer(httpsOptions, app).listen(PLUGIN_PORT, () => {
    logger.info(`Upgrade Planner server running on port ${PLUGIN_PORT} (HTTPS)`);
    logger.info(`Serving API and static files from ${frontendPath}`);
  });
} else {
  // Fallback to HTTP if certificates are not available
  app.listen(PORT, () => {
    logger.info(`Upgrade Planner server running on port ${PORT} (HTTP)`);
    logger.info(`Serving API and static files from ${frontendPath}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
