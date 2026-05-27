#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  const args = {
    brainRoot: 'D:\\dev\\brain',
    output: 'docs/brain-cleanup-dry-run-v1.md',
    format: 'md',
    maxFiles: 5000,
    includeContentPreview: false,
    maxPreviewChars: 240,
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
      case '--output':
        if (!value) throw new Error('--output 값이 필요합니다.');
        args.output = value;
        i += 1;
        break;
      case '--format': {
        if (!value) throw new Error('--format 값이 필요합니다.');
        const fmt = value.trim().toLowerCase();
        if (fmt !== 'md' && fmt !== 'csv') throw new Error('--format은 md 또는 csv만 허용됩니다.');
        args.format = fmt;
        i += 1;
        break;
      }
      case '--max-files':
        if (!value) throw new Error('--max-files 값이 필요합니다.');
        args.maxFiles = Math.max(1, Number.parseInt(value, 10) || 5000);
        i += 1;
        break;
      case '--include-content-preview': {
        if (!value) throw new Error('--include-content-preview 값이 필요합니다.');
        args.includeContentPreview = !/^false|0|no$/i.test(value.trim());
        i += 1;
        break;
      }
      case '--max-preview-chars':
        if (!value) throw new Error('--max-preview-chars 값이 필요합니다.');
        args.maxPreviewChars = Math.max(0, Number.parseInt(value, 10) || 240);
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

function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

function toRel(root, fullPath) {
  const rel = path.relative(root, fullPath);
  return normalizePath(rel || '.');
}

function isSensitiveLine(line) {
  return /api\s*key|token|secret|authorization|bearer|password|key\s*=|key=/i.test(line);
}

function collectRules(relPath) {
  const rules = [];
  const normalized = normalizePath(relPath).toLowerCase();
  if (/(^|\/)identity(\.|\/|$)/.test(normalized)) rules.push('keep:identity');
  if (/(^|\/)goals(\.|\/|$)/.test(normalized)) rules.push('keep:goals');
  if (/(^|\/)decisions(\.|\/|$)/.test(normalized)) rules.push('keep:decisions');
  if (/(role|roles|definition|definitions)/.test(normalized)) rules.push('keep:role-definitions');
  if (/company_state\.json$/.test(normalized)) rules.push('keep:company_state');
  if (normalized.includes('_company/_shared')) rules.push('keep:_company/_shared');
  if (normalized.includes('_company/_agents')) rules.push('keep:_company/_agents');
  if (normalized.includes('/sessions/')) rules.push('archive:sessions');
  if (/auto-safe/.test(normalized)) rules.push('archive:auto-safe');
  if (/run-plan|run-safe|run-ready/.test(normalized)) rules.push('archive:run-plan');
  if (/cancel-plan/.test(normalized)) rules.push('archive:cancel-plan');
  if (/delegate/.test(normalized)) rules.push('archive:delegate');
  if (/gemini|openai-compatible|openai compatible/.test(normalized)) rules.push('archive:gemini-openai-compatible');
  if (/5060|수익화|mvp|파일럿|강의/.test(normalized)) rules.push('summary:5060-course');
  if (/researcher|writer|ceo/.test(normalized)) rules.push('summary:role-repeat');
  if (/routing|role routing/.test(normalized)) rules.push('summary:role-routing');
  if (/api.?key|apikey|invalid/.test(normalized)) rules.push('delete:api-key-invalid');
  return rules;
}

function decideAction(relPath, rules, contentSignals) {
  const normalized = normalizePath(relPath).toLowerCase();
  if (normalized.includes('_company/_shared')) return { action: 'KEEP', category: 'keep', reason: 'shared operational knowledge', riskLevel: 'none', requiresManualReview: false, targetPath: '' };
  if (normalized.includes('_company/_agents')) return { action: 'KEEP', category: 'keep', reason: 'agent prompts / memories / tools', riskLevel: 'none', requiresManualReview: false, targetPath: '' };
  if (/identity(\.|\/|$)/.test(normalized)) return { action: 'KEEP', category: 'keep', reason: 'identity baseline', riskLevel: 'none', requiresManualReview: false, targetPath: '' };
  if (/goals(\.|\/|$)/.test(normalized)) return { action: 'KEEP', category: 'keep', reason: 'goals baseline', riskLevel: 'none', requiresManualReview: false, targetPath: '' };
  if (/decisions(\.|\/|$)/.test(normalized)) return { action: 'KEEP', category: 'keep', reason: 'decisions baseline', riskLevel: 'none', requiresManualReview: false, targetPath: '' };
  if (/company_state\.json$/.test(normalized)) return { action: 'KEEP', category: 'keep', reason: 'company current state snapshot', riskLevel: 'none', requiresManualReview: false, targetPath: '' };

  if (rules.some(r => r.startsWith('delete:'))) {
    return { action: 'DELETE_CANDIDATE', category: 'delete', reason: 'obvious invalid / duplicate / failure artifact', riskLevel: 'high', requiresManualReview: true, targetPath: '' };
  }
  if (rules.some(r => r.startsWith('summary:'))) {
    return { action: 'SUMMARY_CANDIDATE', category: 'summary', reason: 'repeated output is better summarized', riskLevel: 'medium', requiresManualReview: true, targetPath: '' };
  }
  if (rules.some(r => r.startsWith('archive:'))) {
    const archiveFolder = rules.find(r => r.startsWith('archive:'))?.slice('archive:'.length) || 'general';
    return {
      action: 'ARCHIVE_CANDIDATE',
      category: 'archive',
      reason: archiveFolder,
      riskLevel: 'medium',
      requiresManualReview: true,
      targetPath: `D:/dev/brain/_archive/${archiveFolder}/${relPath}`,
    };
  }

  if (contentSignals?.sensitive) {
    return { action: 'REVIEW_REQUIRED', category: 'review', reason: 'sensitive keywords detected', riskLevel: 'critical', requiresManualReview: true, targetPath: '' };
  }

  return { action: 'REVIEW_REQUIRED', category: 'review', reason: 'ambiguous / requires human review', riskLevel: 'low', requiresManualReview: true, targetPath: '' };
}

async function readPreview(filePath, maxChars) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return raw.slice(0, maxChars);
  } catch {
    return '';
  }
}

async function walkFiles(root, maxFiles) {
  const items = [];
  async function visit(dir) {
    if (items.length >= maxFiles) return;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (items.length >= maxFiles) break;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await visit(full);
      } else if (entry.isFile()) {
        const stat = await fs.stat(full);
        items.push({ full, stat });
      }
    }
  }
  await visit(root);
  return items;
}

function formatMd(rows, meta) {
  const lines = [];
  lines.push('# Brain Cleanup Safe Dry-Run');
  lines.push('');
  lines.push(`- brainRoot: \`${meta.brainRoot}\``);
  lines.push(`- totalFilesScanned: ${meta.totalFilesScanned}`);
  lines.push(`- outputFormat: md`);
  lines.push(`- includeContentPreview: ${meta.includeContentPreview}`);
  lines.push('');
  lines.push('| action | sourcePath | targetPath | reason | category | riskLevel | requiresManualReview | lastWriteTime | sizeBytes | matchedRules |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- |');
  for (const row of rows) {
    lines.push([
      row.action,
      row.sourcePath,
      row.targetPath || '-',
      row.reason,
      row.category,
      row.riskLevel,
      row.requiresManualReview ? 'yes' : 'no',
      row.lastWriteTime,
      row.sizeBytes,
      row.matchedRules.join('; '),
    ].map(v => `| ${String(v).replace(/\|/g, '\\|')} `).join('') + '|');
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('- 이 문서는 dry-run 결과만 담고 있으며 실제 이동/삭제를 수행하지 않는다.');
  lines.push('- 민감정보가 탐지되면 원문은 출력하지 않고 matchedRules에만 기록한다.');
  return lines.join('\n');
}

function formatCsv(rows) {
  const header = ['action', 'sourcePath', 'targetPath', 'reason', 'category', 'riskLevel', 'requiresManualReview', 'lastWriteTime', 'sizeBytes', 'matchedRules'];
  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push([
      row.action,
      row.sourcePath,
      row.targetPath || '',
      row.reason,
      row.category,
      row.riskLevel,
      row.requiresManualReview ? 'true' : 'false',
      row.lastWriteTime,
      row.sizeBytes,
      row.matchedRules.join('; '),
    ].map(escapeCsv).join(','));
  }
  return lines.join('\n');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const brainRoot = path.resolve(opts.brainRoot);
  const outPath = path.resolve(opts.output);

  const files = await walkFiles(brainRoot, opts.maxFiles);
  const rows = [];

  for (const { full, stat } of files) {
    const rel = toRel(brainRoot, full);
    const lowerRel = rel.toLowerCase();
    const matchedRules = collectRules(rel);

    let contentSignals = { sensitive: false, previewSuppressed: true };
    if (opts.includeContentPreview) {
      const preview = await readPreview(full, opts.maxPreviewChars);
      const sensitive = preview.split(/\r?\n/).some(isSensitiveLine);
      contentSignals = { sensitive, previewSuppressed: sensitive || !preview };
      if (preview && !sensitive) {
        matchedRules.push('preview:included');
      } else if (sensitive) {
        matchedRules.push('sensitive:masked');
      }
    } else {
      const preview = await readPreview(full, Math.min(256, opts.maxPreviewChars));
      const sensitive = preview.split(/\r?\n/).some(isSensitiveLine);
      if (sensitive) {
        contentSignals = { sensitive: true, previewSuppressed: true };
        matchedRules.push('sensitive:masked');
      }
    }

    const decision = decideAction(rel, matchedRules, contentSignals);
    const row = {
      action: decision.action,
      sourcePath: normalizePath(rel),
      targetPath: decision.targetPath ? normalizePath(decision.targetPath) : '',
      reason: decision.reason,
      category: decision.category,
      riskLevel: decision.riskLevel,
      requiresManualReview: decision.requiresManualReview,
      lastWriteTime: stat.mtime.toISOString(),
      sizeBytes: stat.size,
      matchedRules,
    };

    if (
      lowerRel.includes('_company/_shared') ||
      lowerRel.includes('_company/_agents') ||
      lowerRel.includes('identity') ||
      lowerRel.includes('goals') ||
      lowerRel.includes('decisions') ||
      lowerRel.includes('company_state.json')
    ) {
      row.action = 'KEEP';
      row.category = 'keep';
      row.reason = row.reason || 'protected baseline';
      row.riskLevel = 'none';
      row.requiresManualReview = false;
      row.targetPath = '';
    }

    rows.push(row);
  }

  rows.sort((a, b) => {
    const rank = { KEEP: 0, REVIEW_REQUIRED: 1, ARCHIVE_CANDIDATE: 2, SUMMARY_CANDIDATE: 3, DELETE_CANDIDATE: 4 };
    return (rank[a.action] ?? 9) - (rank[b.action] ?? 9) || a.sourcePath.localeCompare(b.sourcePath);
  });

  const outputText = opts.format === 'csv'
    ? formatCsv(rows)
    : formatMd(rows, { brainRoot, totalFilesScanned: files.length, includeContentPreview: opts.includeContentPreview });

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, outputText, 'utf8');

  console.log(`[brain-cleanup-safe] dry-run complete`);
  console.log(`- brainRoot: ${brainRoot}`);
  console.log(`- scannedFiles: ${files.length}`);
  console.log(`- output: ${outPath}`);
  console.log(`- format: ${opts.format}`);
  console.log(`- keep=${rows.filter(r => r.action === 'KEEP').length} archive=${rows.filter(r => r.action === 'ARCHIVE_CANDIDATE').length} summary=${rows.filter(r => r.action === 'SUMMARY_CANDIDATE').length} delete=${rows.filter(r => r.action === 'DELETE_CANDIDATE').length} review=${rows.filter(r => r.action === 'REVIEW_REQUIRED').length}`);
}

main().catch(err => {
  console.error(`[brain-cleanup-safe] failed: ${err?.message || String(err)}`);
  process.exitCode = 1;
});
