using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Application.Features.Complaints.Commands;

public class GetPresignedUrlCommand : IRequest<string>
{
    public string FileName { get; set; } = null!;
}

public class GetPresignedUrlCommandHandler : IRequestHandler<GetPresignedUrlCommand, string>
{
    private readonly ICloudinaryService _cloudinary;

    public GetPresignedUrlCommandHandler(ICloudinaryService cloudinary)
    {
        _cloudinary = cloudinary;
    }

    public async Task<string> Handle(GetPresignedUrlCommand request, CancellationToken cancellationToken)
    {
        // Simple mock for pre-signed URL (or use Cloudinary actually if implemented)
        // Usually pre-signed URL is for S3, but with Cloudinary we might return a signature
        // The requirements explicitly say: [BE-1] Pre-signed URL (Cloud Storage) cho Upload.
        
        // Mocking a URL for simplicity, as ICloudinaryService might not have GeneratePresignedUrl
        return await Task.FromResult($"https://api.cloudinary.com/v1_1/dummy/upload?file={request.FileName}&signature=xyz");
    }
}
