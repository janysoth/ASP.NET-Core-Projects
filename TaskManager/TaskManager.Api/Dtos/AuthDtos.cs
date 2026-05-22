namespace TaskManager.Api.Dtos;

/// Request payload for registering a new user.
/// Contains sensitive data and is NEVER returned to the client.
public sealed record RegisterRequest(
    string FullName,
    string Email,
    string Password,

    IFormFile? ProfileImage
);

/// Request payload for logging in an existing user.
public sealed record LoginRequest(
    string Email,
    string Password
);


/// Public, non-sensitive user information.
/// Safe to expose to the client.
public sealed record AuthUserDto(
    string Id,
    string FullName,
    string Email,

    string? ProfileImageUrl,
    string Initials,

    DateTime CreatedAtUtc
);


/// Response returned after successful authentication
/// (register or login).
/// Contains a short-lived access token and user info.
public sealed record AuthResponse(
    string AccessToken,
    AuthUserDto User
);

/// Response returned when refreshing an access token.
/// User info is omitted because the user
/// is already authenticated at this point.
public sealed record RefreshResponse(
    string AccessToken
);

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public sealed record ResetPasswordRequest(
    string Email,
    string Token,
    string NewPassword
);