namespace TaskManager.Api.Dtos;

public sealed record RegisterRequest(string FullName, string Email, string Password);
public sealed record LoginRequest(string Email, string Password);

public sealed record AuthResponse(string AccessToken);
public sealed record RefreshResponse(string AccessToken);
