const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const path = require('path');

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
    const { userId, fileId } = job.data;

    if (!userId) {
        throw new Error('Missing userId');
    }
    if (!fileId) {
        throw new Error('Missing fileId');
    }

    const fileDocument = await DBClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId });

    if (!fileDocument) {
        throw new Error('File not found');
    }

    const sizes = [500, 250, 100];
    const originalFilePath = path.join(process.env.FOLDER_PATH || '/tmp/files_manager', `${fileId}`);

    await Promise.all(sizes.map(async (size) => {
        try {
            const thumbnail = await imageThumbnail(originalFilePath, { width: size });
            const thumbnailFilePath = path.join(process.env.FOLDER_PATH || '/tmp/files_manager', `${fileId}_${size}`);
            await fs.writeFile(thumbnailFilePath, thumbnail);
        } catch (error) {
            console.error(`Error generating thumbnail for size ${size}: ${error.message}`);
        }
    }));
});