// =====================================================
// Program.cs
// =====================================================

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

var envPath = Path.Combine(builder.Environment.ContentRootPath, ".env");

if (!File.Exists(envPath))
{
    throw new InvalidOperationException($".env file not found at: {envPath}");
}

Env.Load(envPath);
builder.Configuration.AddEnvironmentVariables();

//
// =====================================================
// 2️⃣ Strongly-typed configuration with validation
// =====================================================
//

builder.Services.AddOptions<MongoDbSettings>()
    .Bind(builder.Configuration.GetSection("MongoDb"))
    .Validate(s => !string.IsNullOrWhiteSpace(s.ConnectionString),
        "MongoDb:ConnectionString is missing")
    .Validate(s => !string.IsNullOrWhiteSpace(s.DatabaseName),
        "MongoDb:DatabaseName is missing")
    .ValidateOnStart();

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
// 3️⃣ MongoDB client + database
// =====================================================
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
// 4️⃣ Dependency Injection
// =====================================================
//

builder.Services.AddSingleton<UserRepository>();
builder.Services.AddSingleton<TodoRepository>();

builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddSingleton<AuthService>();
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
// 6️⃣ CORS
// =====================================================
//

var frontendOrigin =
    builder.Configuration["Frontend:Origin"] ?? "http://localhost:5173";

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("DevCors", policy =>
        policy.WithOrigins(frontendOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

//
// =====================================================
// 7️⃣ JWT authentication (Access tokens only)
// =====================================================
//

var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()
    ?? throw new InvalidOperationException("Jwt section is missing.");

var signingKey =
    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key));

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

//
// =====================================================
// 8️⃣ MongoDB startup health check
// =====================================================
//

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();
    var result = db.RunCommand<BsonDocument>(new BsonDocument("ping", 1));
    Console.WriteLine("MongoDB connection OK: " + result.ToJson());
}

//
// =====================================================
// 9️⃣ Middleware pipeline (CORRECT ORDER)
// =====================================================
//

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ❌ HTTPS disabled because you're using HTTP locally
// app.UseHttpsRedirection();

// ✅ REQUIRED: enables endpoint routing
app.UseRouting();

// CORS must run before auth for browser calls
app.UseCors("DevCors");

app.UseAuthentication();
app.UseAuthorization();

// ✅ Executes matched controller endpoints
app.MapControllers();

app.Run();
