import { connectDB, disconnectDB } from '../config/db.js';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';

async function fixJobApplicantsCount() {
  await connectDB();
  console.log('🔄 Recalculating exact real applicants count for all jobs in database...');

  // Group real counts from Application collection
  const appCounts = await Application.aggregate([
    { $group: { _id: '$jobId', count: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>();
  for (const item of appCounts) {
    countMap.set(item._id.toString(), item.count);
  }

  const jobs = await Job.find({});
  let updatedCount = 0;

  for (const job of jobs) {
    const realCount = countMap.get(job._id.toString()) || 0;
    if (job.applicantsCount !== realCount) {
      await Job.findByIdAndUpdate(job._id, { applicantsCount: realCount });
      updatedCount++;
    }
  }

  console.log(`✅ Completed! Synchronized ${updatedCount} jobs to exact applicant count (Total jobs: ${jobs.length}).`);
  await disconnectDB();
  process.exit(0);
}

fixJobApplicantsCount().catch((err) => {
  console.error('Error fixing applicants count:', err);
  process.exit(1);
});
