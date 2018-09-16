module.exports =  { upload_image_to_google_cloud, map_images_from_gcp_bucket };

const {Storage} = require('@google-cloud/storage');
const sharp = require('sharp');

// To authenticate with Google Cloud, ensure that your GOOGLE_APPLICATION_CREDENTIALS
// environment variable is set properly.
//
// See https://cloud.google.com/docs/authentication/getting-started

// Google Cloud Platform project ID
const projectId = 'picturelo-216522';

// When prepossessing images for upload, resize to these dimensions
const PREPROCESS_WIDTH = 500;
const PREPROCESS_HEIGHT = 500;

// Creates a GCP Storage client
const storage = new Storage({
    projectId: projectId,
});

function upload_image_to_google_cloud(do_preprocess, bucket_name, image_readable_stream, image_uuid, on_finish, on_error) {

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

function map_images_from_gcp_bucket(bucket_name, image_map_fn) {
    // Apply map function to bytes of each image from a bucket

    let pictures_bucket = storage.bucket(bucket_name);
    let file_count = 0;
    pictures_bucket.getFilesStream()
        .on('error', console.error)
        .on('data', function(file) {
            // file is a File object.
            file_count += 1;
            file.download(function(err, contents) {
                if (err) {
                    console.error(err)
                } else {
                    image_map_fn(contents)
                }
            });
        })
        .on('end', function() {
            // All files retrieved.
            console.log('All files (' + file_count + ' in total) from ' + bucket_name + ' retrieved')
        });
}


//
// Examples. Uncomment to Use:
//

//
// Display every image in the bucket to terminal
//

// const bucket_to_download_images_from = 'preprocessed_pictures';
// const terminalImage = require('terminal-image');
// function example_map_fn(image_contents) {
//     (async () => {
//         console.log(await terminalImage.buffer(image_contents));
//     })();
// }
//
// map_images_from_gcp_bucket(bucket_to_download_images_from, example_map_fn);

//
// Upload a jpg file to a bucket
//

// const bucket_name_to_upload_to = 'preprocessed_pictures';
// const local_file_path = '/Users/JB/Downloads/hot-dog-not-hot-dog/train/hot_dog/996310.jpg';
// const image_uuid = '996310';
//
// const fs = require('fs');
// let localReadStream = fs.createReadStream(local_file_path);
//
// // Passing true here for 'do_preprocess' resizes the image before uploading it.
// upload_image_to_google_cloud(true, bucket_name_to_upload_to, localReadStream, image_uuid,
//     () => {
//         console.log('Successfully uploaded ' + local_file_path + ' to ' + bucket_name_to_upload_to)
//     },
//     (err) => {
//         console.error('Failed to upload ' + local_file_path + ' to ' + bucket_name_to_upload_to
//             + ":\n" + err)
//     });