import mongoose, { Document, Schema } from 'mongoose';

export interface IDataRecord {
   timeStamp: string,
   productCode: string,
   roiPercentage: number,
   roiState: string 
}

export interface IDataRecordModel extends IDataRecord, Document {}

const DataRecordSchema: Schema = new Schema(
    {
      timeStamp: { type: String, required: true },
      productCode: { type: String, required: true },
      roiPercentage: { type: Number, required: true },
      roiState: { type: String, required: true },
    },
    {
        versionKey: false,
        collection: 'data'
    }
);

export default mongoose.model<IDataRecordModel>('data', DataRecordSchema);