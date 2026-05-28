using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using SaveFoodBackend.Interfaces;
using System;
using System.Threading.Tasks;

namespace SaveFoodBackend.Services
{
    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(IConfiguration config)
        {
            var acc = new Account(
                config["Cloudinary:CloudName"],
                config["Cloudinary:ApiKey"],
                config["Cloudinary:ApiSecret"]
            );
            _cloudinary = new Cloudinary(acc);
        }

        public async Task<(string SecureUrl, string PublicId)> UploadImageAsync(IFormFile file, string? existingPublicId = null)
        {
            if (file == null || file.Length == 0) return (null, null);

            using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Transformation = new Transformation().Height(500).Width(500).Crop("fill").Gravity("face")
            };

            if (!string.IsNullOrEmpty(existingPublicId))
            {
                uploadParams.PublicId = existingPublicId;
                uploadParams.Overwrite = true;
            }

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            
            if (uploadResult.Error != null)
            {
                throw new Exception(uploadResult.Error.Message);
            }

            return (uploadResult.SecureUrl.ToString(), uploadResult.PublicId);
        }

        public async Task<List<(string SecureUrl, string PublicId)>> UploadImagesAsync(IEnumerable<IFormFile> files)
        {
            var results = new System.Collections.Generic.List<(string SecureUrl, string PublicId)>();

            if (files == null) return results;

            foreach (var file in files)
            {
                if (file.Length == 0) continue;

                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream)
                    // No gravity or transformation for product images to preserve ratio
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                
                if (uploadResult.Error != null)
                {
                    throw new Exception(uploadResult.Error.Message);
                }

                results.Add((uploadResult.SecureUrl.ToString(), uploadResult.PublicId));
            }

            return results;
        }

        public async Task DeleteImageAsync(string publicId)
        {
            if (string.IsNullOrEmpty(publicId)) return;

            var deletionParams = new DeletionParams(publicId);
            var result = await _cloudinary.DestroyAsync(deletionParams);

            if (result.Error != null)
            {
                throw new Exception(result.Error.Message);
            }
        }
    }
}
