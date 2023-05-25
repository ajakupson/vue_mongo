import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import DataRecord from '../models/DataRecord';

const readAll = (req: Request, res: Response, next: NextFunction) => {
    return DataRecord.find()
        .then((records) => res.status(200).json({ records }))
        .catch((error) => res.status(500).json({ error }));
};

export default { readAll };