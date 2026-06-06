import { dbClient } from '@repo/db';
import type { FastifyInstance } from 'fastify';
import { globSync } from 'glob';
import * as path from 'node:path';
import { configureServer } from '../server.config.js';

const testFilePattern = path.join('src', '**', '*.test.ts');
const ignoreFolderPattern = path.join('src', 'test', '**');

let server: FastifyInstance;

before(async () => {
  server = await configureServer('test.env');
});

const testFiles = globSync(testFilePattern, { absolute: true, ignore: ignoreFolderPattern });
for (const file of testFiles) {
  await import(file);
}

after(async () => {
  await dbClient.$disconnect();
  await server.close();
});
