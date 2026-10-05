const fs = require('fs');

let auditRaw = fs.readFileSync('AUDIT/raw/10_npm_audit.json', 'utf8');
auditRaw = auditRaw.replace(/^\uFEFF/, '');
const audit = JSON.parse(auditRaw);

const vulns = [];

if (audit.vulnerabilities) {
  for (const [pkg, info] of Object.entries(audit.vulnerabilities)) {
    const via = Array.isArray(info.via) ? info.via : [];
    via.forEach(v => {
      if (typeof v === 'object') {
        vulns.push({
          package: pkg,
          severity: v.severity || info.severity,
          advisory_id: v.url ? v.url.split('/').pop() : 'N/A',
          title: v.title || 'Vulnerability',
          installed_version: info.range || 'N/A',
          patched_version: typeof info.fixAvailable === 'object' ? info.fixAvailable.version : (info.fixAvailable ? 'Available' : 'None'),
          path: info.nodes ? info.nodes.join(' > ') : pkg,
          reachable: 'DEV_DEPENDENCY_ONLY'
        });
      } else if (typeof v === 'string') {
        vulns.push({
          package: pkg,
          severity: info.severity,
          advisory_id: 'GHSA-transitive',
          title: `Depends on ${v}`,
          installed_version: info.range || 'N/A',
          patched_version: typeof info.fixAvailable === 'object' ? info.fixAvailable.version : (info.fixAvailable ? 'Available' : 'None'),
          path: info.nodes ? info.nodes.join(' > ') : pkg,
          reachable: 'DEV_DEPENDENCY_ONLY'
        });
      }
    });
  }
}

let csv = 'package,severity,advisory_id,installed_version,patched_version,path,reachable\n';
vulns.forEach(v => {
  csv += `"${v.package}","${v.severity}","${v.advisory_id}","${v.installed_version}","${v.patched_version}","${v.path}","${v.reachable}"\n`;
});
fs.writeFileSync('AUDIT/dependencies_vulns.csv', csv, 'utf8');
console.log('Saved AUDIT/dependencies_vulns.csv with', vulns.length, 'records.');
