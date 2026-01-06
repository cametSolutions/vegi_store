import express from 'express';
import { 
  initiateAccountSummaryDownload, 
  getDownloadStatus 
} from '../../controller/downloadController/downloadController.js';

const router = express.Router();

// POST or GET - initiate download
router.get('/:reportType', initiateAccountSummaryDownload);



// Poll for status
router.get('/status/:jobId', getDownloadStatus);

export default router;
