import chalk from 'chalk';
// @ts-ignore
import convertHrtime from 'convert-hrtime';


/**
 * Provided two numbers, returns a string describing the relative difference
 * between them.
 */
export function relativeRate(a: number, b: number): string {
  if (a === b) {
    return 'equal';
  }

  const descriptor = b > a ? 'faster' : 'slower';
  const rate = b > a ? b / a : a / b;

  return `${rate.toFixed(2)}x ${descriptor}`;
}


export interface TestOptions {
  n: number;
  label: string;
  baseTime?: number;
}


/**
 * Used by perf.ts to run performance tests.
 */
export function doTest({n, label, baseTime}: TestOptions, fn: Function) {
  const startTime = process.hrtime();

  for (let i = 0; i < n; i++) {
    fn();
  }

  const {milliseconds} = convertHrtime(process.hrtime(startTime));

  if (process.env.NODE_ENV !== 'test') {
    if (baseTime) {
      const relative = relativeRate(milliseconds, baseTime);
      console.log(`Test: ${chalk.green.bold(label)}\n  N:\t${chalk.yellow(n.toLocaleString())}\n  Time:\t${chalk.yellow(`${milliseconds.toFixed(2)}ms`)} (${relative}).\n`);
    } else {
      console.log(`Test: ${chalk.green.bold(label)}\n  N:\t${chalk.yellow(n.toLocaleString())}\n  Time:\t${chalk.yellow(`${milliseconds.toFixed(2)}ms`)}.\n`);
    }
  }

  return milliseconds;
}
