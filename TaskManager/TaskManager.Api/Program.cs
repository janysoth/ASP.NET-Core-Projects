// Program.cs

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

// ----------------------------------------------------
// 1) Load .env deterministically from project root
//    - Keeps secrets (Mongo connection, JWT key) out of appsettings.json
// ----------------------------------------------------
var envPath = Path.Combine(builder.Environment.ContentRootPath, ".env");

if (!File.Exists(envPath))
{
    throw new InvalidOperationException($".env file not found at: {envPath}");
}

Env.Load(envPath);

// Reload environment variables into configuration
builder.Configuration.AddEnvironmentVariables();

// ----------------------------------------------------
// 2) Strongly-typed settings with validation
//    MongoDbSettings and JwtSettings should match your appsettings.json structure
// ----------------------------------------------------
builder.Services.AddOptions<MongoDbSettings>()
    .Bind(builder.Configuration.GetSection("MongoDb"))
    .Validate(s => !string.IsNullOrWhiteSpace(s.ConnectionString), "MongoDb:ConnectionString is missing")
    .Validate(s => !string.IsNullOrWhiteSpace(s.DatabaseName), "MongoDb:DatabaseName is missing")
    .ValidateOnStart();

builder.Services.AddOptions<JwtSettings>()
    .Bind(builder.Configuration.GetSection("Jwt"))
    .Validate(s => !string.IsNullOrWhiteSpace(s.Issuer), "Jwt:Issuer is missing")
    .Validate(s => !string.IsNullOrWhiteSpace(s.Audience), "Jwt:Audience is missing")
    .Validate(s => !string.IsNullOrWhiteSpace(s.Key) && s.Key.Length >= 32, "Jwt:Key is missing or too short (>= 32 chars)")
    .ValidateOnStart();

// ----------------------------------------------------
// 3) MongoDB client + database (shared, injected as IMongoDatabase)
// ----------------------------------------------------
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

// ----------------------------------------------------
// 4) Application Repositories & Services DI
//    (these types come from the refresh-token + todos structure we built)
// ----------------------------------------------------

// Repositories (assume they take IMongoDatabase in ctor)
builder.Services.AddSingleton<UserRepository>();
builder.Services.AddSingleton<TodoRepository>();

// Core auth + todo services
builder.Services.AddSingleton<JwtTokenService>(); // uses JwtSettings via IOptions<JwtSettings>
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<TodoService>();

// ----------------------------------------------------
// 5) Controllers + Swagger
// ----------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ----------------------------------------------------
// 6) CORS for SPA (React) + cookies
//    Frontend:Origin should be set in appsettings.json or .env
//    Example: Frontend__Origin=http://localhost:5173
// ----------------------------------------------------
var frontendOrigin = builder.Configuration["Frontend:Origin"] ?? "http://localhost:5173";

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("DevCors", policy =>
        policy.WithOrigins(frontendOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()); // needed for refresh-token HttpOnly cookie
});

// ----------------------------------------------------
// 7) JWT Authentication (Access Token)
//    JwtSettings should include: Issuer, Audience, Key, AccessTokenMinutes
// ----------------------------------------------------
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()
          ?? throw new InvalidOperationException("Jwt section is missing.");

if (string.IsNullOrWhiteSpace(jwt.Key))
{
    throw new InvalidOperationException("Jwt:Key is empty. Check Jwt__Key in .env.");
}

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,

            ValidateAudience = true,
            ValidAudience = jwt.Audience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// ----------------------------------------------------
// 8) 🔴 MongoDB startup ping (forces real connection at startup)
// ----------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();

    var result = db.RunCommand<BsonDocument>(
        new BsonDocument("ping", 1)
    );

    Console.WriteLine("MongoDB connection OK: " + result.ToJson());
}

// ----------------------------------------------------
// 9) Middleware pipeline
// ----------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// CORS must be before auth for browser calls
app.UseCors("DevCors");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
