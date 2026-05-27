#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

function parseArgs(argv) {
  const args = {
    brainRoot: 'D:\\dev\\brain',
    plan: 'docs/brain-archive-move-dry-run-v1.md',
    manifest: 'docs/brain-archive-apply-manifest-v1.md',
    apply: false,
    confirm: '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const next = argv[i + 1];
    const value = next && !next.startsWith('--') ? next : undefined;

    switch (key) {
      case '--brain-root':
        if (!value) throw new Error('--brain-root 값이 필요합니다.');
        args.brainRoot = value;
        i += 1;
        break;
      case '--plan':
        if (!value) throw new Error('--plan 값이 필요합니다.');
        args.plan = value;
        i += 1;
        break;
      case '--manifest':
        if (!value) throw new Error('--manifest 값이 필요합니다.');
        args.manifest = value;
        i += 1;
        break;
      case '--apply':
        args.apply = true;
        break;
      case '--confirm':
        if (!value) throw new Error('--confirm 값이 필요합니다.');
        args.confirm = value.trim();
        i += 1;
        break;
      default:
        throw new Error(`알 수 없는 옵션: ${key}`);
    }
  }

  return args;
}

function escapeCsv(value) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function normalizePathText(value) {
  return String(value || '').trim().replace(/^`+|`+$/g, '').replace(/[ \t]+$/g, '');
}

function isSubPath(child, parent) {
  const rel = path.relative(parent, child);
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function isProtectedRelative(relPath) {
  const p = relPath.replace(/\\/g, '/').toLowerCase();
  return (
    p.includes('/_company/_shared/') ||
    p.startsWith('_company/_shared/') ||
    p.includes('/_company/_agents/') ||
    p.startsWith('_company/_agents/') ||
    /(^|\/)identity(\.|\/|$)/.test(p) ||
    /(^|\/)goals(\.|\/|$)/.test(p) ||
    /(^|\/)decisions(\.|\/|$)/.test(p) ||
    /company_state\.json$/.test(p)
  );
}

function parsePlanTable(md) {
  const rows = [];
  for (const line of md.split(/\r?\n/)) {
    if (!line.startsWith('| MOVE_DRY_RUN |')) continue;
    const cols = line.split('|').map(s => s.trim());
    // cols: ["", "MOVE_DRY_RUN", sourcePattern, target, reason, riskLevel, requiresManualReview, status, ""]
    const action = cols[1] || '';
    const sourcePathPattern = normalizePathText(cols[2]);
    const targetArchiveFolder = normalizePathText(cols[3]);
    const reason = normalizePathText(cols[4]);
    const riskLevel = normalizePathText(cols[5]).toLowerCase();
    const requiresManualReview = normalizePathText(cols[6]).toLowerCase();
    const planStatus = normalizePathText(cols[7]).toUpperCase();
    if (!action || !sourcePathPattern || !targetArchiveFolder) continue;
    rows.push({
      action,
      sourcePathPattern,
      targetArchiveFolder,
      reason,
      riskLevel: riskLevel || 'low',
      requiresManualReview: requiresManualReview === 'yes' ? 'yes' : 'no',
      planStatus,
    });
  }
  return rows;
}

function resolveCandidateSourcePath(brainRoot, sourcePathPattern) {
  const normalized = sourcePathPattern.replace(/\\/g, '/');
  if (normalized.includes('*') || normalized.includes('?')) {
    const cleaned = normalized.replace(/\/\*\*$/g, '').replace(/\*+$/g, '');
    return path.resolve(brainRoot, cleaned);
  }
  return path.resolve(brainRoot, normalized);
}

function resolveTargetPath(brainRoot, targetArchiveFolder, sourcePath) {
  const rel = path.relative(brainRoot, sourcePath);
  return path.resolve(targetArchiveFolder, rel);
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function statusForPlan(row, safety) {
  if (!safety.ok) return 'SKIPPED';
  if (row.planStatus !== 'PLANNED' && row.planStatus !== 'MOVE_DRY_RUN') return 'SKIPPED';
  return 'PLANNED';
}

function formatMarkdown(rows, summary) {
  const lines = [];
  lines.push('# Brain Archive Apply Manifest');
  lines.push('');
  lines.push(`- mode: ${summary.mode}`);
  lines.push(`- planned count: ${summary.planned}`);
  lines.push(`- moved count: ${summary.moved}`);
  lines.push(`- skipped count: ${summary.skipped}`);
  lines.push(`- failed count: ${summary.failed}`);
  lines.push('');
  lines.push('| status | sourcePath | targetPath | action | applied | reason | error |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const row of rows) {
    lines.push([
      row.status,
      row.sourcePath,
      row.targetPath,
      row.action,
      row.applied ? 'true' : 'false',
      row.reason,
      row.error || '',
    ].map(v => `| ${String(v).replace(/\|/g, '\\|')} `).join('') + '|');
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('- 이 문서는 archive 이동 결과 기록만 담는다.');
  lines.push('- 삭제는 절대 수행하지 않는다.');
  return lines.join('\n');
}

function formatCsv(rows, summary) {
  const header = ['status', 'sourcePath', 'targetPath', 'action', 'applied', 'reason', 'error'];
  const lines = [
    `mode,${escapeCsv(summary.mode)}`,
    `planned count,${summary.planned}`,
    `moved count,${summary.moved}`,
    `skipped count,${summary.skipped}`,
    `failed count,${summary.failed}`,
    '',
    header.join(','),
  ];
  for (const row of rows) {
    lines.push([
      row.status,
      row.sourcePath,
      row.targetPath,
      row.action,
      row.applied ? 'true' : 'false',
      row.reason,
      row.error || '',
    ].map(escapeCsv).join(','));
  }
  return lines.join('\n');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const brainRoot = path.resolve(opts.brainRoot);
  const planPath = path.resolve(opts.plan);
  const manifestPath = path.resolve(opts.manifest);
  const archiveRoot = path.join(brainRoot, '_archive');
  const applyAllowed = opts.apply && opts.confirm === 'ARCHIVE_APPROVED';
  const mode = applyAllowed ? 'APPLY' : 'DRY_RUN';

  const planMd = await fs.readFile(planPath, 'utf8');
  const planRows = parsePlanTable(planMd);
  const manifestRows = [];

  let plannedCount = 0;
  let movedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const row of planRows) {
    const sourcePath = resolveCandidateSourcePath(brainRoot, row.sourcePathPattern);
    const targetPath = resolveTargetPath(brainRoot, row.targetArchiveFolder, sourcePath);
    const sourceRel = path.relative(brainRoot, sourcePath).replace(/\\/g, '/');
    const targetRel = path.relative(archiveRoot, targetPath).replace(/\\/g, '/');
    const safety = {
      ok:
        isSubPath(sourcePath, brainRoot) &&
        isSubPath(targetPath, archiveRoot) &&
        !isProtectedRelative(sourceRel) &&
        !isProtectedRelative(targetRel),
      reason: '',
    };

    if (!safety.ok) {
      const manifestRow = {
        status: 'SKIPPED',
        sourcePath: sourcePath,
        targetPath,
        action: row.action,
        applied: false,
        reason: row.reason,
        error: 'safety check failed',
      };
      manifestRows.push(manifestRow);
      skippedCount += 1;
      continue;
    }

    if (!(await pathExists(sourcePath))) {
      const manifestRow = {
        status: 'SKIPPED',
        sourcePath,
        targetPath,
        action: row.action,
        applied: false,
        reason: row.reason,
        error: 'source path not found',
      };
      manifestRows.push(manifestRow);
      skippedCount += 1;
      continue;
    }

    plannedCount += 1;

    if (!applyAllowed) {
      const manifestRow = {
        status: 'PLANNED',
        sourcePath,
        targetPath,
        action: row.action,
        applied: false,
        reason: row.reason,
        error: '',
      };
      manifestRows.push(manifestRow);
      continue;
    }

    try {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.rename(sourcePath, targetPath);
      const manifestRow = {
        status: 'MOVED',
        sourcePath,
        targetPath,
        action: row.action,
        applied: true,
        reason: row.reason,
        error: '',
      };
      manifestRows.push(manifestRow);
      movedCount += 1;
    } catch (err) {
      const manifestRow = {
        status: 'FAILED',
        sourcePath,
        targetPath,
        action: row.action,
        applied: false,
        reason: row.reason,
        error: String(err?.message || err),
      };
      manifestRows.push(manifestRow);
      failedCount += 1;
    }
  }

  const summary = {
    mode,
    planned: plannedCount,
    moved: movedCount,
    skipped: skippedCount,
    failed: failedCount,
  };

  const outputText = opts.manifest.toLowerCase().endsWith('.csv')
    ? formatCsv(manifestRows, summary)
    : formatMarkdown(manifestRows, summary);

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, outputText, 'utf8');

  console.log(`mode: ${mode}`);
  console.log(`planned count: ${plannedCount}`);
  console.log(`moved count: ${movedCount}`);
  console.log(`skipped count: ${skippedCount}`);
  console.log(`failed count: ${failedCount}`);
  console.log(`manifest path: ${manifestPath}`);
}

main().catch(err => {
  console.error(`[brain-archive-apply-safe] failed: ${err?.message || String(err)}`);
  process.exitCode = 1;
});
