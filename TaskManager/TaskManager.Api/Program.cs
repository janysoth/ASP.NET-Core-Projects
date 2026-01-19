using System.Text;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Bson;
using MongoDB.Driver;
using TaskManager.Api.Auth;
using TaskManager.Api.Repositories;
using TaskManager.Api.Services;
using TaskManager.Api.Settings;

var builder = WebApplication.CreateBuilder(args);

//
// =====================================================
// 1️⃣ Load environment variables from .env (FAIL FAST)
// =====================================================
//
// Purpose:
// - Keeps secrets out of source control
// - Ensures the app never boots without required secrets
//

var envPath = Path.Combine(builder.Environment.ContentRootPath, ".env");

if (!File.Exists(envPath))
{
    // Crash immediately if .env is missing
    // Prevents accidentally running with empty secrets
    throw new InvalidOperationException($".env file not found at: {envPath}");
}

// Load variables from .env into process environment
Env.Load(envPath);

// Add environment variables to ASP.NET configuration system
builder.Configuration.AddEnvironmentVariables();

//
// =====================================================
// 2️⃣ Strongly-typed configuration with validation
// =====================================================
//
// Purpose:
// - Catch misconfiguration at startup (not at runtime)
// - Avoid string-based configuration lookups everywhere
//

builder.Services.AddOptions<MongoDbSettings>()
    .Bind(builder.Configuration.GetSection("MongoDb"))
    .Validate(s => !string.IsNullOrWhiteSpace(s.ConnectionString),
        "MongoDb:ConnectionString is missing")
    .Validate(s => !string.IsNullOrWhiteSpace(s.DatabaseName),
        "MongoDb:DatabaseName is missing")
    .ValidateOnStart(); // App will NOT start if invalid

builder.Services.AddOptions<JwtSettings>()
    .Bind(builder.Configuration.GetSection("Jwt"))
    .Validate(s => !string.IsNullOrWhiteSpace(s.Issuer),
        "Jwt:Issuer is missing")
    .Validate(s => !string.IsNullOrWhiteSpace(s.Audience),
        "Jwt:Audience is missing")
    .Validate(s => !string.IsNullOrWhiteSpace(s.Key) && s.Key.Length >= 32,
        "Jwt:Key must be at least 32 characters")
    .ValidateOnStart();

//
// =====================================================
// 3️⃣ MongoDB client + database (Singleton)
// =====================================================
//
// Why Singleton?
// - MongoClient is thread-safe
// - Recommended by MongoDB official docs
//

builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;
    return new MongoClient(settings.ConnectionString);
});

builder.Services.AddSingleton<IMongoDatabase>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;
    var client = sp.GetRequiredService<IMongoClient>();
    return client.GetDatabase(settings.DatabaseName);
});

//
// =====================================================
// 4️⃣ Dependency Injection: Repositories & Services
// =====================================================
//
// Purpose:
// - Enforces separation of concerns
// - Keeps controllers thin
//

// Data access layer
builder.Services.AddSingleton<UserRepository>();
builder.Services.AddSingleton<TodoRepository>();

// Business logic layer
builder.Services.AddSingleton<JwtTokenService>(); // Access tokens only
builder.Services.AddSingleton<AuthService>();     // Login, register, refresh
builder.Services.AddSingleton<TodoService>();

//
// =====================================================
// 5️⃣ Controllers & Swagger
// =====================================================
//
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

//
// =====================================================
// 6️⃣ CORS configuration (SPA + cookies)
// =====================================================
//
// Critical for:
// - React frontend
// - HttpOnly refresh token cookies
//

var frontendOrigin =
    builder.Configuration["Frontend:Origin"] ?? "http://localhost:5173";

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("DevCors", policy =>
        policy.WithOrigins(frontendOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()); // REQUIRED for cookies
});

//
// =====================================================
// 7️⃣ JWT authentication (ACCESS TOKENS ONLY)
// =====================================================
//

var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()
    ?? throw new InvalidOperationException("Jwt section is missing.");

if (string.IsNullOrWhiteSpace(jwt.Key))
{
    throw new InvalidOperationException("Jwt:Key is empty.");
}

var signingKey =
    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            // Validate token issuer
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,

            // Validate token audience
            ValidateAudience = true,
            ValidAudience = jwt.Audience,

            // Validate token signature
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,

            // Validate expiration
            ValidateLifetime = true,

            // Small clock drift allowance
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

//
// =====================================================
// 8️⃣ MongoDB startup health check
// =====================================================
//
// Forces MongoDB to be reachable at startup
// Prevents app running in half-broken state
//

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();

    var result = db.RunCommand<BsonDocument>(
        new BsonDocument("ping", 1)
    );

    Console.WriteLine("MongoDB connection OK: " + result.ToJson());
}

//
// =====================================================
// 9️⃣ Middleware pipeline (ORDER MATTERS)
// =====================================================
//

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// CORS must come BEFORE authentication
app.UseCors("DevCors");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
