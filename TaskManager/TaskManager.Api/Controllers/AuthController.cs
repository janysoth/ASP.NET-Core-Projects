using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Dtos;
using TaskManager.Api.Services;

namespace TaskManager.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
  private readonly AuthService _auth;
  private readonly IConfiguration _config;

  public AuthController(AuthService auth, IConfiguration config)
  {
    _auth = auth;
    _config = config;
  }

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

  [HttpPost("logout")]
  public async Task<IActionResult> Logout()
  {
    var cookieName = _config["RefreshToken:CookieName"] ?? "tm_refresh";
    var refreshToken = Request.Cookies[cookieName];

    await _auth.RevokeAsync(refreshToken ?? "");

    Response.Cookies.Delete(cookieName);
    return NoContent();
  }

  private void SetRefreshCookie(string refreshToken)
  {
    var cookieName = _config["RefreshToken:CookieName"] ?? "tm_refresh";

    // Dev note:
    // - For cross-site cookies in production, you need SameSite=None and Secure=true over HTTPS.
    // - In local dev with HTTP, cookies may behave differently depending on browser settings.

    Response.Cookies.Append(cookieName, refreshToken, new CookieOptions
    {
      HttpOnly = true,
      Secure = false, // set true in production HTTPS
      SameSite = SameSiteMode.Lax,
      Expires = DateTimeOffset.UtcNow.AddDays(int.Parse(_config["RefreshToken:DaysToExpire"] ?? "7"))
    });
  }
}
