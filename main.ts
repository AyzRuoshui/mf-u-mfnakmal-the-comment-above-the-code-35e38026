import fs from 'node:fs';
import path from 'node:path';

function requireValue(value: string | undefined, flag: string): string {
  if (!value || value.startsWith('-')) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

/**
 * 解析命令行参数与环境变量，确定最终输出文件路径。
 */
function resolveOutputPath(argv: string[]): string {
  let outFile: string | undefined;
  let outDir: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out' || arg === '--output' || arg === '-o') {
      outFile = requireValue(argv[i + 1], arg);
      i += 1;
    } else if (arg.startsWith('--out=')) {
      outFile = requireValue(arg.slice('--out='.length), '--out');
    } else if (arg.startsWith('--output=')) {
      outFile = requireValue(arg.slice('--output='.length), '--output');
    } else if (arg.startsWith('-o=')) {
      outFile = requireValue(arg.slice('-o='.length), '-o');
    } else if (arg === '--out-dir') {
      outDir = requireValue(argv[i + 1], arg);
      i += 1;
    } else if (arg.startsWith('--out-dir=')) {
      outDir = requireValue(arg.slice('--out-dir='.length), '--out-dir');
    }
  }

  if (outFile) {
    if (outFile.endsWith('/') || outFile.endsWith('\\') || (fs.existsSync(outFile) && fs.statSync(outFile).isDirectory())) {
      return path.join(outFile, 'entry.txt');
    }
    return outFile;
  }
  if (outDir) {
    return path.join(outDir, 'entry.txt');
  }
  const envDir = process.env.MAKEFUN_OUTPUT_DIR?.trim();
  if (envDir) {
    return path.join(envDir, 'entry.txt');
  }
  return '/output/entry.txt';
}

const COMMENT_LINE =
  '// Keep this catch block empty; last time we logged the error, prod filled its disk before CI finished building the revert.';

const codePoints = [...COMMENT_LINE].length;
if (codePoints < 1 || codePoints > 200 || COMMENT_LINE.includes('\n')) {
  throw new Error(`Invalid entry length or multiline content: ${codePoints}`);
}

const targetPath = resolveOutputPath(process.argv.slice(2));
fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.writeFileSync(targetPath, COMMENT_LINE, 'utf8');
