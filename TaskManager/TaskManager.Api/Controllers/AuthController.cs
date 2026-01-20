using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Dtos;
using TaskManager.Api.Services;

namespace TaskManager.Api.Controllers;

[ApiController]
// Enables automatic model validation and consistent API behavior
[Route("api/[controller]")]
// Base route: /api/auth
public sealed class AuthController : ControllerBase
{
  // Service that contains all authentication logic
  private readonly AuthService _auth;

  // Used to read values from appsettings.json
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
      // Create user, access token, and refresh token
      var (res, refreshToken) = await _auth.RegisterAsync(req);

      // Store refresh token securely in HttpOnly cookie
      SetRefreshCookie(refreshToken);

      // Return access token + user info
      return Ok(res);
    }
    catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
    {
      // Validation or duplicate user errors
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
      // Validate credentials and generate tokens
      var (res, refreshToken) = await _auth.LoginAsync(req);

      // Save refresh token in cookie
      SetRefreshCookie(refreshToken);

      return Ok(res);
    }
    catch
    {
      // Do not expose details for security reasons
      return Unauthorized(new { error = "Invalid credentials." });
    }
  }

  // =========================
  // REFRESH ACCESS TOKEN
  // =========================
  [HttpPost("refresh")]
  public async Task<ActionResult<RefreshResponse>> Refresh()
  {
    try
    {
      // Cookie name from config or fallback
      var cookieName = _config["RefreshToken:CookieName"] ?? "tm_refresh";

      // Extract refresh token from HttpOnly cookie
      var refreshToken = Request.Cookies[cookieName];

      // Validate refresh token and rotate it
      var (res, newRefreshToken) = await _auth.RefreshAsync(refreshToken ?? "");

      // Replace old refresh token with new one
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

    // Get refresh token from cookie
    var refreshToken = Request.Cookies[cookieName];

    // Revoke token in database
    await _auth.RevokeAsync(refreshToken ?? "");

    // Remove cookie from browser
    Response.Cookies.Delete(cookieName);

    return NoContent();
  }

  // =========================
  // COOKIE HELPER
  // =========================
  private void SetRefreshCookie(string refreshToken)
  {
    var cookieName = _config["RefreshToken:CookieName"] ?? "tm_refresh";

    // HttpOnly cookie prevents JavaScript access (XSS protection)
    Response.Cookies.Append(cookieName, refreshToken, new CookieOptions
    {
      HttpOnly = true,

      // Set TRUE in production (HTTPS)
      Secure = false,

      // Lax allows same-site requests but blocks most CSRF
      SameSite = SameSiteMode.Lax,

      // Refresh token expiration
      Expires = DateTimeOffset.UtcNow.AddDays(
        int.Parse(_config["RefreshToken:DaysToExpire"] ?? "7")
      )
    });
  }
}
