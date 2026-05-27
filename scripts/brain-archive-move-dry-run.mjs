#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

function parseArgs(argv) {
  const args = {
    brainRoot: 'D:\\dev\\brain',
    approval: 'docs/brain-archive-approval-list-v1.md',
    output: 'docs/brain-archive-move-dry-run-v1.md',
    format: 'md',
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
      case '--approval':
        if (!value) throw new Error('--approval 값이 필요합니다.');
        args.approval = value;
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

function isSensitiveRule(text) {
  return /sensitive:masked/i.test(text);
}

function isExcludedPattern(text) {
  return /identity|goals|decisions|company_state\.json|_company\/_shared|_company\/_agents/i.test(text);
}

function classifyStatus(row) {
  if (row.riskLevel === 'high' || row.riskLevel === 'critical') return 'NEEDS_REVIEW';
  if (row.riskLevel === 'medium' || row.riskLevel === 'low') return 'PLANNED';
  return 'SKIPPED';
}

function parseApprovalList(md) {
  const rows = [];
  const lines = md.split(/\r?\n/);
  for (const line of lines) {
    if (!line.startsWith('| YES |')) continue;
    const cols = line.split('|').map(s => s.trim());
    // cols: ["", "YES", sourcePath, targetArchiveFolder, reason, riskLevel, notes, ""]
    const approve = cols[1];
    const sourcePath = cols[2] || '';
    const targetArchiveFolder = cols[3] || '';
    const reason = cols[4] || '';
    const riskLevel = (cols[5] || '').toLowerCase();
    const notes = cols[6] || '';

    if (approve !== 'YES') continue;
    if (!sourcePath || !targetArchiveFolder) continue;
    if (isSensitiveRule(line)) continue;
    if (isExcludedPattern(sourcePath)) continue;

    rows.push({
      action: 'MOVE_DRY_RUN',
      sourcePathPattern: sourcePath,
      targetArchiveFolder,
      reason,
      riskLevel: riskLevel || 'low',
      requiresManualReview: 'yes',
      notes,
    });
  }
  return rows;
}

function formatMarkdown(rows, summary) {
  const lines = [];
  lines.push('# Brain Archive Move Dry-Run');
  lines.push('');
  lines.push(`- planned count: ${summary.planned}`);
  lines.push(`- skipped count: ${summary.skipped}`);
  lines.push(`- needsReview count: ${summary.needsReview}`);
  lines.push('');
  lines.push('| action | sourcePathPattern | targetArchiveFolder | reason | riskLevel | requiresManualReview | status |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const row of rows) {
    lines.push([
      row.action,
      row.sourcePathPattern,
      row.targetArchiveFolder,
      row.reason,
      row.riskLevel,
      row.requiresManualReview,
      row.status,
    ].map(v => `| ${String(v).replace(/\|/g, '\\|')} `).join('') + '|');
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('- 이 문서는 실제 이동을 수행하지 않는다.');
  lines.push('- archive 폴더는 생성하지 않는다.');
  lines.push('- 승인 목록 기준으로 계획만 정리한다.');
  return lines.join('\n');
}

function formatCsv(rows, summary) {
  const header = ['action', 'sourcePathPattern', 'targetArchiveFolder', 'reason', 'riskLevel', 'requiresManualReview', 'status'];
  const lines = [
    `planned count,${summary.planned}`,
    `skipped count,${summary.skipped}`,
    `needsReview count,${summary.needsReview}`,
    '',
    header.join(','),
  ];
  for (const row of rows) {
    lines.push([
      row.action,
      row.sourcePathPattern,
      row.targetArchiveFolder,
      row.reason,
      row.riskLevel,
      row.requiresManualReview,
      row.status,
    ].map(escapeCsv).join(','));
  }
  return lines.join('\n');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const approvalPath = path.resolve(opts.approval);
  const outputPath = path.resolve(opts.output);

  const approvalMd = await fs.readFile(approvalPath, 'utf8');
  const baseRows = parseApprovalList(approvalMd);

  const rows = baseRows.map((row) => {
    const status = classifyStatus(row);
    return { ...row, status };
  });

  const planned = rows.filter(r => r.status === 'PLANNED').length;
  const skipped = rows.filter(r => r.status === 'SKIPPED').length;
  const needsReview = rows.filter(r => r.status === 'NEEDS_REVIEW').length;

  const outputText = opts.format === 'csv'
    ? formatCsv(rows, { planned, skipped, needsReview })
    : formatMarkdown(rows, { planned, skipped, needsReview });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, outputText, 'utf8');

  console.log(`[brain-archive-move-dry-run] dry-run complete`);
  console.log(`- planned count: ${planned}`);
  console.log(`- skipped count: ${skipped}`);
  console.log(`- needsReview count: ${needsReview}`);
  console.log(`- output path: ${outputPath}`);
}

main().catch(err => {
  console.error(`[brain-archive-move-dry-run] failed: ${err?.message || String(err)}`);
  process.exitCode = 1;
});
