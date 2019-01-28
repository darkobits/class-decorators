const {concurrent, series} = require('nps-utils');

module.exports = () => {
  const test = {
    default: {
      description: 'Run unit tests.',
      script: 'jest'
    },
    watch: {
      description: 'Run unit tests in watch mode.',
      script: 'jest --watch'
    },
    coverage: {
      description: 'Run unit tests and generate a coverage report.',
      script: 'jest --coverage'
    }
  };

  const clean = 'del dist';
  const tslint = 'tslint --project tsconfig.json --format codeFrame';
  const tsc = 'tsc --emitDeclarationOnly';
  const babel = 'babel src --extensions=".ts" --out-dir="dist" --source-maps="inline"';
  const postbuild = 'del "dist/**/*{spec,perf}*"';

  const build = {
    default: {
      description: 'Build the project.',
      script: series(clean, tslint, concurrent({tsc, babel}), postbuild)
    },
    watch: {
      description: 'Continuously build the project.',
      script: series(clean, tslint, concurrent({tsc: `${tsc} --watch --preserveWatchOutput`, babel: `${babel} --watch --verbose`}))
    }
  };

  const prebump = concurrent.nps('test', 'build');

  const bump = {
    default: {
      description: 'Compute version bump, generate change log, and create a tagged commit.',
      script: `${prebump} && standard-version`
    },
    beta: {
      description: 'Compute version bump, generate change log, and create a tagged commit for a beta release.',
      script: `${prebump} && standard-version --prerelease=beta`
    }
  };

  const prepare = {
    script: series.nps('test', 'build')
  };

  const perf = {
    description: 'Run performance benchmarks.',
    script: 'babel-node --extensions=".ts" src/etc/perf.ts'
  };

  return {
    scripts: {
      prepare,
      test,
      build,
      bump,
      perf
    }
  };
}
