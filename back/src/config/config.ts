import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'envelope';
const DB_COLLECTION = 'data';

const SERVER_PORT = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 1337;

export const config = {
    mongo: {
        url: MONGO_URL,
        db: DB_NAME,
        collection: DB_COLLECTION
    },
    server: {
        port: SERVER_PORT
    }
};