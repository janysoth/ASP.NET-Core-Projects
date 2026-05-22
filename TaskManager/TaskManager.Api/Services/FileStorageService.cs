using Microsoft.AspNetCore.Http;

namespace TaskManager.Api.Services;

public sealed class FileStorageService
{
  private readonly IWebHostEnvironment _env;

  public FileStorageService(IWebHostEnvironment env)
  {
    _env = env;
  }

  public async Task<string> SaveProfileImageAsync(IFormFile file)
  {
    if (file == null || file.Length == 0)
      throw new InvalidOperationException("Invalid profile image.");

    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };

    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

    if (!allowedExtensions.Contains(extension))
      throw new InvalidOperationException("Only jpg, jpeg, png, webp allowed.");

    var uploadsFolder = Path.Combine(
        _env.WebRootPath,
        "uploads",
        "profiles"
    );

    Directory.CreateDirectory(uploadsFolder);

    var fileName = $"{Guid.NewGuid()}{extension}";
    var filePath = Path.Combine(uploadsFolder, fileName);

    await using var stream = new FileStream(filePath, FileMode.Create);
    await file.CopyToAsync(stream);

    return $"/uploads/profiles/{fileName}";
  }
}