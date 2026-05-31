using System.Net.Mail;

using TaskManager.Api.Auth;
using TaskManager.Api.Dtos;
using TaskManager.Api.Models;
using TaskManager.Api.Repositories;
using TaskManager.Api.Helpers;

namespace TaskManager.Api.Services;

/// <summary>
/// Handles all authentication-related business logic.
/// </summary>
public sealed class AuthService
{
  private readonly UserRepository _users;
  private readonly JwtTokenService _jwt;
  private readonly IConfiguration _config;
  private readonly EmailService _emailService;
  private readonly FileStorageService _fileStorage;

  public AuthService(
      UserRepository users,
      JwtTokenService jwt,
      IConfiguration config,
      EmailService emailService,
      FileStorageService fileStorage)
  {
    _users = users;
    _jwt = jwt;
    _config = config;
    _emailService = emailService;
    _fileStorage = fileStorage;
  }

  // ----------------------------------------------------
  // REGISTER
  // ----------------------------------------------------
  public async Task<(AuthResponse Response, string RefreshToken)> RegisterAsync(RegisterRequest req)
  {
    var fullName = req.FullName.Trim();
    var email = req.Email.Trim().ToLowerInvariant();

    if (string.IsNullOrWhiteSpace(fullName))
      throw new ArgumentException("FullName is required.");

    if (string.IsNullOrWhiteSpace(email))
      throw new ArgumentException("Email is required.");

    if (!IsValidEmail(email))
      throw new ArgumentException("Invalid Email format.");

    if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 8)
      throw new ArgumentException("Password must be at least 8 characters.");

    var existing = await _users.GetByEmailAsync(email);
    if (existing is not null)
      throw new InvalidOperationException("Email already registered.");

    var initials = UserHelpers.GetInitials(fullName);

    string? profileImageUrl = null;

    if (req.ProfileImage is not null)
    {
      profileImageUrl = await _fileStorage.SaveProfileImageAsync(req.ProfileImage);
    }

    var user = new User
    {
      FullName = fullName,
      Email = email,
      PasswordHash = PasswordHasher.Hash(req.Password),

      ProfileImageUrl = profileImageUrl,
      Initials = initials,

      CreatedAtUtc = DateTime.UtcNow,
      RefreshTokens = new List<RefreshTokenRecord>()
    };

    var refresh = IssueRefreshToken();
    user.RefreshTokens.Add(refresh.Record);

    await _users.CreateAsync(user);

    var accessToken = _jwt.CreateAccessToken(user);

    var userDto = new AuthUserDto(
        user.Id!,
        user.FullName,
        user.Email,

        user.ProfileImageUrl,
        user.Initials,

        user.CreatedAtUtc
    );

    return (
        new AuthResponse(accessToken, userDto),
        refresh.RawToken
    );
  }

  // ----------------------------------------------------
  // LOGIN
  // ----------------------------------------------------
  public async Task<(AuthResponse Response, string RefreshToken)> LoginAsync(LoginRequest req)
  {
    var email = req.Email.Trim().ToLowerInvariant();
    var user = await _users.GetByEmailAsync(email);

    if (user is null || !PasswordHasher.Verify(req.Password, user.PasswordHash))
      throw new InvalidOperationException("Invalid credentials.");

    var refresh = IssueRefreshToken();
    user.RefreshTokens.Add(refresh.Record);

    PruneOldRefreshTokens(user);
    await _users.UpdateAsync(user);

    var accessToken = _jwt.CreateAccessToken(user);

    var userDto = new AuthUserDto(
        user.Id!,
        user.FullName,
        user.Email,

        user.ProfileImageUrl,
        user.Initials,

        user.CreatedAtUtc
    );

    return (
        new AuthResponse(accessToken, userDto),
        refresh.RawToken
    );
  }

  // ----------------------------------------------------
  // REFRESH ACCESS TOKEN
  // ----------------------------------------------------
  public async Task<(RefreshResponse Response, string NewRefreshToken)> RefreshAsync(string rawRefreshToken)
  {
    if (string.IsNullOrWhiteSpace(rawRefreshToken))
      throw new InvalidOperationException("Missing refresh token.");

    var tokenHash = Crypto.Sha256(rawRefreshToken);

    var user = await _users.GetByRefreshTokenHashAsync(tokenHash);
    if (user is null)
      throw new InvalidOperationException("Invalid refresh token.");

    var existing = user.RefreshTokens.FirstOrDefault(t => t.TokenHash == tokenHash);
    if (existing is null || !existing.IsActive)
      throw new InvalidOperationException("Refresh token expired or revoked.");

    existing.RevokedAtUtc = DateTime.UtcNow;

    var replacement = IssueRefreshToken();
    existing.ReplacedByTokenHash = replacement.Record.TokenHash;
    user.RefreshTokens.Add(replacement.Record);

    PruneOldRefreshTokens(user);
    await _users.UpdateAsync(user);

    var newAccessToken = _jwt.CreateAccessToken(user);

    return (
        new RefreshResponse(newAccessToken),
        replacement.RawToken
    );
  }

  // ----------------------------------------------------
  // LOGOUT / REVOKE REFRESH TOKEN
  // ----------------------------------------------------
  public async Task RevokeAsync(string rawRefreshToken, string accessToken)
  {
    if (string.IsNullOrWhiteSpace(rawRefreshToken))
      return;

    var tokenHash = Crypto.Sha256(rawRefreshToken);

    var user = await _users.GetByRefreshTokenHashAsync(tokenHash);
    if (user is null)
      return;

    var token = user.RefreshTokens.FirstOrDefault(t => t.TokenHash == tokenHash);
    if (token is null)
      return;

    if (token.RevokedAtUtc is null)
      token.RevokedAtUtc = DateTime.UtcNow;

    // Revoke access token
    if (!string.IsNullOrWhiteSpace(accessToken))
    {
      _jwt.RevokeToken(accessToken); // Assume this calls a method to track revoked tokens
    }

    await _users.UpdateAsync(user);
  }

  // ----------------------------------------------------
  // GET USER BY ID
  // ----------------------------------------------------
  public async Task<User?> GetUserByIdAsync(string userId)
  {
    return await _users.GetByIdAsync(userId);
  }

  // ----------------------------------------------------
  // VALIDATE TOKEN
  // ----------------------------------------------------
  public bool ValidateToken(string token)
  {
    return _jwt.ValidateToken(token); // Call method from JwtTokenService
  }

  // ----------------------------------------------------
  // CHANGE PASSWORD
  // ----------------------------------------------------
  public async Task ChangePasswordAsync(
      string userId,
      string currentPassword,
      string newPassword)
  {
    if (string.IsNullOrWhiteSpace(currentPassword))
      throw new ArgumentException("Current password is required.");

    if (string.IsNullOrWhiteSpace(newPassword))
      throw new ArgumentException("New password is required.");

    if (newPassword.Length < 8)
      throw new ArgumentException("New password must be at least 8 characters.");

    var user = await _users.GetByIdAsync(userId);

    if (user is null)
      throw new InvalidOperationException("User not found.");

    var isCurrentPasswordValid = PasswordHasher.Verify(
        currentPassword,
        user.PasswordHash
    );

    if (!isCurrentPasswordValid)
      throw new UnauthorizedAccessException("Current password is incorrect.");

    // Prevent reusing same password
    if (PasswordHasher.Verify(newPassword, user.PasswordHash))
      throw new ArgumentException("New password must be different from current password.");

    user.PasswordHash = PasswordHasher.Hash(newPassword);

    // Optional security improvement:
    // revoke all refresh tokens after password change
    foreach (var token in user.RefreshTokens.Where(t => t.IsActive))
    {
      token.RevokedAtUtc = DateTime.UtcNow;
    }

    await _users.UpdateAsync(user);
  }

  // ----------------------------------------------------
  // FORGOT PASSWORD
  // ----------------------------------------------------
  public async Task ForgotPasswordAsync(ForgotPasswordRequest req)
  {
    var email = req.Email.Trim().ToLowerInvariant();
    var user = await _users.GetByEmailAsync(email);

    // Security: don't reveal if user exists
    if (user is null) return;

    // Generate token
    var rawToken = Guid.NewGuid().ToString("N");
    var tokenHash = Crypto.Sha256(rawToken);

    user.PasswordResetTokenHash = tokenHash;
    user.PasswordResetExpiresAtUtc = DateTime.UtcNow.AddMinutes(30);

    await _users.UpdateAsync(user);

    // Create reset link pointing to frontend page
    var resetLink = $"{_config["Frontend:Origin"]}/reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(rawToken)}";

    var subject = "TaskManager Password Reset";
    var body = $@"
        <p>Hello {user.FullName},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href='{resetLink}'>Reset Password</a></p>
        <p>If you did not request this, ignore this email.</p>
    ";

    // Send the email
    var emailService = new EmailService(_config);
    await emailService.SendEmailAsync(email, subject, body);

    Console.WriteLine($"[EMAIL SENT] Reset link: {resetLink}");
  }

  // ----------------------------------------------------
  // RESET PASSWORD
  // ----------------------------------------------------
  public async Task ResetPasswordAsync(ResetPasswordRequest req)
  {
    if (string.IsNullOrWhiteSpace(req.Email))
      throw new ArgumentException("Email is required.");

    if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 8)
      throw new ArgumentException("New password must be at least 8 characters.");

    var email = req.Email.Trim().ToLowerInvariant();
    var user = await _users.GetByEmailAsync(email);

    if (user is null)
      throw new InvalidOperationException("The email doesn't exist.");

    if (string.IsNullOrWhiteSpace(user.PasswordResetTokenHash))
      throw new InvalidOperationException("Reset token is invalid.");

    if (user.PasswordResetExpiresAtUtc is null ||
        user.PasswordResetExpiresAtUtc < DateTime.UtcNow)
      throw new InvalidOperationException("Reset token expired.");

    var incomingHash = Crypto.Sha256(req.Token);

    if (incomingHash != user.PasswordResetTokenHash)
      throw new InvalidOperationException("Reset token is invalid.");

    // Prevent using the same password
    if (PasswordHasher.Verify(req.NewPassword, user.PasswordHash))
      throw new ArgumentException("New password must be different from current password.");

    // Update Password
    user.PasswordHash = PasswordHasher.Hash(req.NewPassword);

    // Clear reset token
    user.PasswordResetTokenHash = null;
    user.PasswordResetExpiresAtUtc = null;

    // Optional: revoke all existing refresh tokens for security
    foreach (var token in user.RefreshTokens.Where(t => t.IsActive))
      token.RevokedAtUtc = DateTime.UtcNow;

    await _users.UpdateAsync(user);
  }

  // ----------------------------------------------------
  // CHECK EMAIL EXISTS
  // ----------------------------------------------------
  public async Task<bool> EmailExistsAsync(string email)
  {
    if (string.IsNullOrWhiteSpace(email))
      return false;

    return await _users.EmailExistsAsync(email.Trim().ToLowerInvariant());
  }

  // ----------------------------------------------------
  // CHECK EMAIL IS VALID
  // ----------------------------------------------------
  private static bool IsValidEmail(string email)
  {
    if (string.IsNullOrWhiteSpace(email))
      return false;

    // Basic structure check
    var regex = new System.Text.RegularExpressions.Regex(
      @"^[^\s@]+@[^\s@]+\.[^\s@]+$",
      System.Text.RegularExpressions.RegexOptions.IgnoreCase
    );

    if (!regex.IsMatch(email))
      return false;

    // Additional strict rules
    if (email.Contains(".."))
      return false;

    if (email.StartsWith(".") || email.EndsWith("."))
      return false;

    if (email.Contains("@.") || email.Contains(".@"))
      return false;

    return true;
  }

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------
  private (string RawToken, RefreshTokenRecord Record) IssueRefreshToken()
  {
    var days = int.Parse(_config["RefreshToken:DaysToExpire"] ?? "7");

    var raw = Crypto.GenerateRefreshToken();
    var hash = Crypto.Sha256(raw);

    return (
        raw,
        new RefreshTokenRecord
        {
          TokenHash = hash,
          CreatedAtUtc = DateTime.UtcNow,
          ExpiresAtUtc = DateTime.UtcNow.AddDays(days)
        }
    );
  }

  // ----------------------------------------------------
  // UPDATE PROFILE IMAGE
  // ----------------------------------------------------
  public async Task<AuthUserDto> UpdateProfileImageAsync(
      string userId,
      IFormFile file)
  {
    var user = await _users.GetByIdAsync(userId);

    if (user is null)
      throw new InvalidOperationException("User not found.");

    var imageUrl =
        await _fileStorage.SaveProfileImageAsync(file);

    user.ProfileImageUrl = imageUrl;

    await _users.UpdateAsync(user);

    return new AuthUserDto(
        user.Id!,
        user.FullName,
        user.Email,
        user.ProfileImageUrl,
        user.Initials,
        user.CreatedAtUtc
    );
  }

  private static void PruneOldRefreshTokens(User user)
  {
    user.RefreshTokens = user.RefreshTokens
        .OrderByDescending(t => t.CreatedAtUtc)
        .Take(20)
        .ToList();
  }
}