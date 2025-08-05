"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3_BUCKET_NAME = exports.sesClient = exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const client_ses_1 = require("@aws-sdk/client-ses");
exports.s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
exports.sesClient = new client_ses_1.SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
exports.S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'sis-application-documents';
//# sourceMappingURL=aws.js.map