const fs = require('fs');
const path = require('path');

const modelsDir = 'backend/src/models';
const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

const modelSummaries = [];
const moneyFields = [];
const denormalizedFields = [];

modelFiles.forEach(file => {
  const filePath = path.join(modelsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const modelName = file.replace('.ts', '');

  // Extract indexes
  const indexMatches = content.matchAll(/\.index\(([^)]+)\)/g);
  const indexes = [];
  for (const m of indexMatches) {
    indexes.push(m[1].trim().replace(/\s+/g, ' '));
  }

  // Check for money fields
  lines.forEach((l, idx) => {
    if (l.match(/salary|amount|price|budget|compensation/i) && l.includes('Number')) {
      moneyFields.push({ model: modelName, file_line: `backend/src/models/${file}:${idx + 1}`, field: l.trim() });
    }
    if (l.match(/companyName|companyLogo|recruiterName|candidateName/i)) {
      denormalizedFields.push({ model: modelName, file_line: `backend/src/models/${file}:${idx + 1}`, field: l.trim() });
    }
  });

  modelSummaries.push({
    modelName,
    file: `backend/src/models/${file}`,
    indexes,
    loc: lines.length
  });
});

// Check services for N+1 query loops
const servicesDir = 'backend/src/services';
const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));
const nPlusOneHotspots = [];

serviceFiles.forEach(file => {
  const filePath = path.join(servicesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let insideLoop = false;
  let loopStartLine = 0;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.match(/\b(for\s*\(|\.forEach\(|\.map\(async|for\s+await)\b/)) {
      insideLoop = true;
      loopStartLine = idx + 1;
    }
    if (insideLoop && trimmed.match(/await\s+[A-Z][a-zA-Z0-9]+\.(find|findById|findOne|updateOne|save)/)) {
      nPlusOneHotspots.push({
        file: `backend/src/services/${file}:${idx + 1}`,
        loopLine: loopStartLine,
        code: trimmed
      });
    }
    if (trimmed === '}' || trimmed === '});') {
      insideLoop = false;
    }
  });
});

let report = '# Data Layer & Database Normalisation Analysis\n\n';
report += `## Entity & Collection Inventory (${modelSummaries.length} Mongoose Models):\n\n`;
report += '| Collection / Model | File | LOC | Defined Compound & Unique Indexes |\n|---|---|---|---|\n';
modelSummaries.forEach(m => {
  report += `| **${m.modelName}** | \`${m.file}\` | ${m.loc} | ${m.indexes.length > 0 ? m.indexes.map(i => `\`${i}\``).join('<br/>') : 'None explicit (default _id only)'} |\n`;
});
report += '\n';

report += `## Floating-Point / Number Money Fields (Precision Risk):\n`;
moneyFields.forEach(mf => {
  report += `- [${mf.file_line}] \`${mf.model}\`: \`${mf.field}\` (Stored as JavaScript IEEE-754 Number / Double; should use integer cents or Decimal128)\n`;
});
report += '\n';

report += `## Denormalized Relational Copies (Sync Risk):\n`;
denormalizedFields.forEach(df => {
  report += `- [${df.file_line}] \`${df.model}\`: \`${df.field}\`\n`;
});
report += '\n';

report += `## N+1 Query Loop Hotspots in Services:\n`;
if (nPlusOneHotspots.length === 0) {
  report += 'No direct await-in-loop ORM queries detected.\n';
} else {
  nPlusOneHotspots.forEach(np => {
    report += `- [${np.file}] inside loop at line ${np.loopLine}: \`${np.code}\`\n`;
  });
}
report += '\n';

report += `## Migration Strategy:\n`;
report += `- Migrations directory: NONE. (No migrate-mongo, Umzug, or Prisma migrations. Mongoose schemas rely entirely on automatic runtime collection creation and in-memory index sync via \`autoIndex\`).\n`;
report += `- Seed scripts: \`backend/src/scripts/seed.ts\`, \`backend/src/scripts/seed50Jobs.ts\`.\n`;

fs.writeFileSync('AUDIT/raw/07_data_layer.txt', report, 'utf8');
console.log('Data layer analysis complete. Models:', modelSummaries.length, 'Money fields:', moneyFields.length, 'N+1 spots:', nPlusOneHotspots.length);
