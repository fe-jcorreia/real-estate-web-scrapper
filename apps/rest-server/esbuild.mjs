import copyfiles from 'copyfiles';
import esbuild from 'esbuild';
import copyStaticFiles from 'esbuild-copy-static-files';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { rimraf } from 'rimraf';

const dirName = import.meta.dirname;
const nodeVersion = readFileSync(join(dirName, '.nvmrc'), 'utf-8').trim().replace('v', '');
const outputDirName = 'dist';

async function treatError(error) {
  await rimraf(outputDirName);
  console.error('Unexpected error occurred while trying to esbuild:', error);
  process.exit(1);
}

function copyNonTypescriptFiles() {
  const sourceFilesPattern = join('src', '**', '*.{html,jpg,jpeg,png,css,json,wsdl,sql}');
  const foldersToExclude = join('src', '{test,scripts,mock,mocks}', '**', '*');
  const patternsToExclude = join('src', '**', '*.mock.*');

  copyfiles(
    [sourceFilesPattern, `${outputDirName}/`],
    { exclude: [foldersToExclude, patternsToExclude], up: 1 },
    async (error) => {
      if (error) {
        await treatError(error);
      }
    }
  );
}

try {
  await rimraf(outputDirName);

  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: 'dist/bundle.mjs',
    format: 'esm',
    platform: 'node',
    target: `node${nodeVersion}`,
    resolveExtensions: ['.js', '.ts'],
    packages: 'external',
    tsconfig: 'prod.tsconfig.json',
    plugins: [
      copyStaticFiles({
        src: '../../node_modules/@fastify/swagger-ui/static',
        dest: 'dist/static',
      }),
    ],
  });

  copyNonTypescriptFiles();
} catch (error) {
  await treatError(error);
}
