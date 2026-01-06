import { reportExportsQueue } from '../../config/queueConfig.js';

export const initiateAccountSummaryDownload = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      company, 
      branch, 
      account,
      transactionType,
      searchTerm,
      format // 'excel' or 'pdf'
    } = req.query;

    // Validation
    if (!startDate || !endDate || !company || !branch) {
      return res.status(400).json({ 
        error: 'Missing required parameters: startDate, endDate, company, branch' 
      });
    }

    if (!format || !['excel', 'pdf'].includes(format)) {
      return res.status(400).json({ 
        error: 'Invalid format. Must be "excel" or "pdf"' 
      });
    }

    // Create job in queue
    const job = await reportExportsQueue.add('account-summary-export', {
      reportType: 'account-summary',
      format,
      filters: {
        startDate,
        endDate,
        company,
        branch,
        account: account || null,
        transactionType: transactionType || null,
        searchTerm: searchTerm || null,
      },
      requestedAt: new Date().toISOString(),
    });

    // Return job ID immediately
    res.json({
      success: true,
      jobId: job.id,
      message: 'Report generation started',
      estimatedTime: '5-10 seconds',
    });

  } catch (error) {
    console.error('Error initiating download:', error);
    res.status(500).json({ 
      error: 'Failed to initiate download',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getDownloadStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const job = await reportExportsQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job.progress;

    // Different responses based on job state
    if (state === 'completed') {
      const result = job.returnvalue;
      return res.json({
        status: 'completed',
        data: result.data, // The actual report data
        fileName: result.fileName,
        recordCount: result.recordCount,
      });
    }

    if (state === 'failed') {
      return res.json({
        status: 'failed',
        error: job.failedReason,
      });
    }

    if (state === 'active') {
      return res.json({
        status: 'processing',
        progress: progress || 0,
        message: 'Generating report...',
      });
    }

    // waiting, delayed, etc.
    return res.json({
      status: 'queued',
      message: 'Job is queued and will start shortly',
    });

  } catch (error) {
    console.error('Error checking job status:', error);
    res.status(500).json({ 
      error: 'Failed to check job status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
