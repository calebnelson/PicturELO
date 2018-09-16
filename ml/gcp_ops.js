const {Storage} = require('@google-cloud/storage');
const sharp = require('sharp');

// Google Cloud Platform project ID
const projectId = 'picturelo-216522';

// Creates a GCP Storage client
const storage = new Storage({
    projectId: projectId,
});

const PREPROCESS_WIDTH = 500;
const PREPROCESS_HEIGHT = 500;

export function upload_image_to_google_cloud(do_preprocess, bucket_name, image_readable_stream, image_uuid, on_finish, on_error) {

    let preprocessed_pictures_bucket = storage.bucket(bucket_name);

    let GCP_file_name = image_uuid + '.jpg';
    let remoteGoogleCloudWriteStream = preprocessed_pictures_bucket.file(GCP_file_name)
        .createWriteStream({
            metadata: {
                contentType: 'image/jpeg',
                metadata: {
                    custom: 'metadata'
                }
            }
        })
        .on('finish', on_finish)
        .on('error', on_error);

    let image_pipeline = remoteGoogleCloudWriteStream;
    if (do_preprocess === true) {
        // Create Sharp pipeline for resizing the image
        image_pipeline = sharp();
        image_pipeline
            .resize(PREPROCESS_WIDTH, PREPROCESS_HEIGHT)
            .pipe(remoteGoogleCloudWriteStream);
    }

    image_readable_stream.pipe(image_pipeline)

}




