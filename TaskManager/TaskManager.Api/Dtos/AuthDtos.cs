namespace TaskManager.Api.Dtos;

/// <summary>
/// Request payload for registering a new user.
/// Contains sensitive data and is NEVER returned to the client.
/// </summary>
public sealed record RegisterRequest(
    string FullName,
    string Email,
    string Password
);

/// <summary>
/// Request payload for logging in an existing user.
/// </summary>
public sealed record LoginRequest(
    string Email,
    string Password
);

/// <summary>
/// Public, non-sensitive user information.
/// Safe to expose to the client.
/// </summary>
public sealed record AuthUserDto(
    string Id,
    string FullName,
    string Email,
    DateTime CreatedOnUtc
);

/// <summary>
/// Response returned after successful authentication
/// (register or login).
/// Contains a short-lived access token and user info.
/// </summary>
public sealed record AuthResponse(
    string AccessToken,
    AuthUserDto User
);

/// <summary>
/// Response returned when refreshing an access token.
/// User info is omitted because the user
/// is already authenticated at this point.
/// </summary>
public sealed record RefreshResponse(
    string AccessToken
);
