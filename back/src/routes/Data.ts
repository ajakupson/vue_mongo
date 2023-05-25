import express from 'express';
import controller from '../controllers/Data';

const router = express.Router();

router.get('/get/', controller.readAll);

export = router;