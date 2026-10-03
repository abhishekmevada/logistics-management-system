const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const uploadToCloudinary = (fileInput, originalName) => {
  return new Promise((resolve, reject) => {
    const options = {
      resource_type: "auto",
      folder: "logistics/documents",
      use_filename: true,
      unique_filename: true,
    };

    if (originalName) {
      const cleanName = originalName
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      options.public_id = `${Date.now()}-${cleanName}`;
    }

    // 1. If fileInput is a file path string
    if (typeof fileInput === "string") {
      cloudinary.uploader.upload(fileInput, options, (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
      return;
    }

    // 2. If fileInput is a Multer file object with a path
    if (fileInput && typeof fileInput === "object" && fileInput.path) {
      cloudinary.uploader.upload(fileInput.path, options, (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
      return;
    }

    // 3. If fileInput is a Buffer or has a buffer property
    const buffer = Buffer.isBuffer(fileInput)
      ? fileInput
      : fileInput?.buffer;

    if (buffer) {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        },
      );
      uploadStream.end(buffer);
      return;
    }

    reject(new Error("No valid file path or buffer provided for Cloudinary upload"));
  });
};

module.exports = uploadToCloudinary;
