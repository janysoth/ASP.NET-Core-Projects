namespace TaskManager.Api.Helpers;

public static class UserHelpers
{
  // =========================
  // GET USER INITIALS
  // =========================
  public static string GetInitials(string fullName)
  {
    if (string.IsNullOrWhiteSpace(fullName))
      return "?";

    var parts = fullName
        .Trim()
        .Split(
            ' ',
            StringSplitOptions.RemoveEmptyEntries
        );

    if (parts.Length == 1)
    {
      return parts[0][0]
          .ToString()
          .ToUpper();
    }

    return string.Concat(
        parts[0][0],
        parts[^1][0]
    ).ToUpper();
  }

  // =========================
  // SAVE PROFILE IMAGE
  // =========================
  public static async Task<string> SaveUploadFile(
      IFormFile file
  )
  {
    if (file.Length <= 0)
    {
      throw new InvalidOperationException(
          "Invalid profile image."
      );
    }

    var allowedExtensions = new[]
    {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };

    var extension = Path.GetExtension(
        file.FileName
    ).ToLowerInvariant();

    if (!allowedExtensions.Contains(extension))
    {
      throw new InvalidOperationException(
          "Only jpg, jpeg, png, and webp files are allowed."
      );
    }

    var uploadsFolder = Path.Combine(
        Directory.GetCurrentDirectory(),
        "wwwroot",
        "uploads",
        "profiles"
    );

    if (!Directory.Exists(uploadsFolder))
    {
      Directory.CreateDirectory(
          uploadsFolder
      );
    }

    var fileName =
        $"{Guid.NewGuid()}{extension}";

    var filePath = Path.Combine(
        uploadsFolder,
        fileName
    );

    await using var stream = new FileStream(
        filePath,
        FileMode.Create
    );

    await file.CopyToAsync(stream);

    return $"/uploads/profiles/{fileName}";
  }
}