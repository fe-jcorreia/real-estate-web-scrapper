import * as fs from 'node:fs';
import type * as http from 'node:http';
import express from 'express';

export type TestRoute = TestResponseRoute | TestHandlerRoute | TestFixtureRoute;
export interface TestResponseRoute extends BaseTestRoute {
  response: {
    body: any;
    code?: number;
  };
  handler?: never;
  fixture?: never;
}

export interface TestHandlerRoute extends BaseTestRoute {
  handler: (_req: express.Request, res: express.Response) => Promise<void>;
  response?: never;
  fixture?: never;
}

export interface TestFixtureRoute extends BaseTestRoute {
  fixture: {
    path: string;
    code?: number;
    transform?: (body: any) => any;
  };
  handler?: never;
  response?: never;
}

interface BaseTestRoute {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  route: string;
}

interface RouteRequestCall {
  body?: any;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

export interface RouteSpy {
  calls: RouteRequestCall[];
}

export class TestServer {
  private app: express.Express;
  private server: http.Server;
  private isOpen = false;

  constructor() {
    this.app = express();
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(express.json());
  }

  addRoute(options: TestRoute): RouteSpy {
    const { method, route } = options;

    const routeSpy = {
      calls: [] as object[],
    };

    if ((options as TestHandlerRoute).handler) {
      this.app[method](route, (req, res, next) => {
        routeSpy.calls.push({
          body: req.body,
          params: req.params,
          query: req.query,
          headers: req.headers,
        });
        (options as TestHandlerRoute)
          .handler(req, res)
          .then(() => next())
          .catch(err => next(err));
      });
    } else if ((options as TestResponseRoute).response) {
      const response = (options as TestResponseRoute).response;
      this.app[method](route, (req: express.Request, res: express.Response) => {
        routeSpy.calls.push({
          body: req.body,
          params: req.params,
          query: req.query,
          headers: req.headers,
        });
        res.statusCode = response?.code || 200;
        res.send(response?.body);
      });
    } else {
      const fixture = (options as TestFixtureRoute).fixture;
      this.app[method](route, (req: express.Request, res: express.Response) => {
        routeSpy.calls.push({
          body: req.body,
          params: req.params,
          query: req.query,
          headers: req.headers,
        });
        res.statusCode = fixture.code || 200;
        const file = fs.readFileSync(fixture.path);
        const responseBody = JSON.parse(file.toString('utf-8'));
        const transform = fixture.transform ?? ((body: any): any => body);
        res.json(transform(responseBody));
      });
    }

    return routeSpy;
  }

  start(port = 9999): Promise<express.Express> {
    return new Promise(resolve => {
      this.isOpen = true;
      this.server = this.app.listen(port, () => resolve(this.app));
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isOpen) {
        resolve();
        return;
      }

      if (!this.server) {
        reject('TestServer not started!');
        return;
      }

      this.server.close(error => {
        if (error) {
          reject(error);
          return;
        }
        this.isOpen = false;
        resolve();
      });
    });
  }
}
