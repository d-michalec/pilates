import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { API_BASE_URL } from './core/api-url';

declare const process: {
  env: Record<string, string | undefined>;
};

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: API_BASE_URL,
      useValue: process.env['PRERENDER_API_URL'] ?? 'http://localhost:8080'
    }
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
