using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskManager.Api.Dtos;
using TaskManager.Api.Services;
using TaskManager.Api.Auth;
using TaskManager.Api.Exceptions;
using System.Reflection.Metadata; // Add this using directive

namespace TaskManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
  private readonly AuthService _auth;
  private readonly IConfiguration _config;

  public AuthController(AuthService auth, IConfiguration config)
  {
    _auth = auth;
    _config = config;
  }

  // =========================
  // REGISTER
  // =========================
  [HttpPost("register")]
  public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
  {
    try
    {
      var (res, refreshToken) = await _auth.RegisterAsync(req);
      SetRefreshCookie(refreshToken);
      return Ok(res);
    }
    catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
    {
      return BadRequest(new { error = ex.Message });
    }
  }

  // =========================
  // LOGIN
  // =========================
  [HttpPost("login")]
  public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
  {
    try
    {
      var (res, refreshToken) = await _auth.LoginAsync(req);
      SetRefreshCookie(refreshToken);
      return Ok(res);
    }
    catch
    {
      return Unauthorized(new { error = "Invalid credentials." });
    }
  }

  // =========================
  // GET USER INFO (JWT)
  // =========================
  [Authorize]
  [HttpGet("get-user-info")]
  public async Task<ActionResult<AuthUserDto>> GetUserInfo()
  {
    var authorizationHeader = Request.Headers["Authorization"].ToString();
    var token = authorizationHeader?.Replace("Bearer ", string.Empty);

    if (string.IsNullOrWhiteSpace(token))
    {
      return Unauthorized(new { error = "No user is currently logged in. Please log in and try again." });
    }

    try
    {
      if (!_auth.ValidateToken(token))
      {
        return Unauthorized(new { error = "No user is currently logged in. Please log in and try again." });
      }
    }
    catch (TokenRevokedException)
    {
      return Unauthorized(new { error = "No user is currently logged in. Please log in and try again." });
    }

    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

    if (string.IsNullOrWhiteSpace(userId))
    {
      return Unauthorized(new { error = "No user is currently logged in. Please log in and try again." });
    }

    var user = await _auth.GetUserByIdAsync(userId);
    if (user is null)
    {
      return Unauthorized(new { error = "No user is currently logged in. Please log in and try again." });
    }

    return Ok(new AuthUserDto(
        user.Id!,
        user.FullName,
        user.Email,
        user.CreatedAtUtc
    ));
  }

  // =========================
  // REFRESH TOKEN
  // =========================
  [HttpPost("refresh")]
  public async Task<ActionResult<RefreshResponse>> Refresh()
  {
    try
    {
      var cookieName = _config["RefreshToken:CookieName"] ?? "tm_refresh";
      var refreshToken = Request.Cookies[cookieName];

      var (res, newRefreshToken) = await _auth.RefreshAsync(refreshToken ?? "");
      SetRefreshCookie(newRefreshToken);

      return Ok(res);
    }
    catch
    {
      return Unauthorized(new { error = "Refresh failed." });
    }
  }

  // =========================
  // LOGOUT
  // =========================
  [HttpPost("logout")]
  public async Task<IActionResult> Logout()
  {
    var cookieName = _config["RefreshToken:CookieName"] ?? "tm_refresh";
    var refreshToken = Request.Cookies[cookieName];

    var authorizationHeader = Request.Headers["Authorization"].ToString();
    var accessToken = authorizationHeader.Replace("Bearer ", "").Trim();

    if (!string.IsNullOrWhiteSpace(refreshToken) && !string.IsNullOrWhiteSpace(accessToken))
    {
      await _auth.RevokeAsync(refreshToken, accessToken);
    }

    // Clear the refresh token cookie
    Response.Cookies.Delete(cookieName); // This removes the cookie from the client's browser
    return Ok(new { message = "You have been successfully logged out." });
  }

  // =========================
  // CHANGE PASSWORD
  // =========================
  [Authorize]
  [HttpPost("change-password")]
  public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
  {
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

    if (string.IsNullOrWhiteSpace(userId))
    {
      return Unauthorized(new { error = "User not found." });
    }

    try
    {
      await _auth.ChangePasswordAsync(
          userId,
          request.CurrentPassword,
          request.NewPassword
      );

      return Ok(new
      {
        message = "Password changed successfully. Please log in again."
      });
    }
    catch (UnauthorizedAccessException ex)
    {
      return BadRequest(new { error = ex.Message });
    }
    catch (Exception ex)
    {
      return BadRequest(new { error = ex.Message });
    }
  }

  // =========================
  // FORGOT PASSWORD
  // =========================
  [HttpPost("forgot-password")]
  public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
  {
    await _auth.ForgotPasswordAsync(request);
    return Ok(new
    {
      message = "If the email exists, a reset link has been sent."
    });
  }

  // =========================
  // RESET PASSWORD
  // =========================
  [HttpPost("reset-password")]
  public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
  {
    try
    {
      await _auth.ResetPasswordAsync(request);
      return Ok(new
      {
        message = "Password reset successfully."
      });
    }
    catch (Exception ex)
    {
      return BadRequest(new { error = ex.Message });
    }
  }

  // =========================
  // COOKIE HELPER
  // =========================
  private void SetRefreshCookie(string refreshToken)
  {
    var cookieName = _config["RefreshToken:CookieName"] ?? "tm_refresh";

    Response.Cookies.Append(cookieName, refreshToken, new CookieOptions
    {
      HttpOnly = true,
      Secure = false, // Set to true in production environments
      SameSite = SameSiteMode.Lax,
      Expires = DateTimeOffset.UtcNow.AddDays(int.Parse(_config["RefreshToken:DaysToExpire"] ?? "7"))
    });
  }
}