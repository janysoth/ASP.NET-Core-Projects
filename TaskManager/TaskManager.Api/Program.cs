using System.Text;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Bson;
using MongoDB.Driver;
using TaskManager.Api.Settings;

var builder = WebApplication.CreateBuilder(args);

// ----------------------------------------------------
// Load .env deterministically from project root
// ----------------------------------------------------
var envPath = Path.Combine(builder.Environment.ContentRootPath, ".env");

if (!File.Exists(envPath))
{
    throw new InvalidOperationException($".env file not found at: {envPath}");
}

Env.Load(envPath);

// IMPORTANT: reload env vars into ASP.NET Core config
builder.Configuration.AddEnvironmentVariables();

// ----------------------------------------------------
// MongoDB settings + validation
// ----------------------------------------------------
builder.Services.AddOptions<MongoDbSettings>()
    .Bind(builder.Configuration.GetSection("MongoDb"))
    .Validate(s => !string.IsNullOrWhiteSpace(s.ConnectionString), "MongoDb:ConnectionString is missing")
    .Validate(s => !string.IsNullOrWhiteSpace(s.DatabaseName), "MongoDb:DatabaseName is missing")
    .ValidateOnStart();

// ----------------------------------------------------
// JWT settings + validation
// ----------------------------------------------------
builder.Services.AddOptions<JwtSettings>()
    .Bind(builder.Configuration.GetSection("Jwt"))
    .Validate(s => !string.IsNullOrWhiteSpace(s.Issuer), "Jwt:Issuer is missing")
    .Validate(s => !string.IsNullOrWhiteSpace(s.Audience), "Jwt:Audience is missing")
    .Validate(s => !string.IsNullOrWhiteSpace(s.Key) && s.Key.Length >= 32, "Jwt:Key is missing or too short (>= 32 chars)")
    .ValidateOnStart();

// ----------------------------------------------------
// MongoDB client + database
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
// JWT Authentication
// ----------------------------------------------------
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()
          ?? throw new InvalidOperationException("Jwt section is missing.");

if (string.IsNullOrWhiteSpace(jwt.Key))
{
    throw new InvalidOperationException("Jwt:Key is empty. Check Jwt__Key in .env.");
}

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ----------------------------------------------------
// 🔴 MONGODB STARTUP PING (FORCES REAL CONNECTION)
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
// Middleware pipeline
// ----------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
