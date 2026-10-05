const fs = require('fs');

let content = fs.readFileSync('AUDIT/fe_be_wiring.csv', 'utf8');
const oldRow = '"await api.patch(`/admin/users/${currentUser?._id}/status`, { status: \'deactivated\' });","frontend/src/pages/AdminProfilePage.tsx:299","PATCH","/admin/users/${currentUser?._id}/status","NONE","UNMATCHED (Dead / Orphan FE Call)","No matching backend endpoint found"';
const newRow = '"await api.patch(`/admin/users/${currentUser?._id}/status`, { status: \'deactivated\' });","frontend/src/pages/AdminProfilePage.tsx:299","PATCH","/admin/users/${currentUser?._id}/status","PATCH /api/v1/admin/users/:id/status","WIRED","Matches backend/src/routes/admin.routes.ts:14"';

content = content.replace(oldRow, newRow);
fs.writeFileSync('AUDIT/fe_be_wiring.csv', content, 'utf8');

let summary = fs.readFileSync('AUDIT/raw/06_backend_summary.txt', 'utf8');
summary = summary.replace('## FE Calls Unmatched (404 risk / dead code): 2', '## FE Calls Unmatched (404 risk / dead code): 1');
summary = summary.replace('- [frontend/src/pages/AdminProfilePage.tsx:299] `PATCH /admin/users/${currentUser?._id}/status`\n', '');
summary = summary.replace('Unmatched Frontend Calls (2):', 'Unmatched Frontend Calls (1):');
fs.writeFileSync('AUDIT/raw/06_backend_summary.txt', summary, 'utf8');

console.log('Successfully fixed fe_be_wiring.csv and summary.');
