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
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.FileProviders;
using TaskManager.Api.Features.Budget.Services;

var builder = WebApplication.CreateBuilder(args);

// 1️⃣ Load .env
var envPath = Path.Combine(builder.Environment.ContentRootPath, ".env");

if (!File.Exists(envPath))
    throw new InvalidOperationException($".env file not found at: {envPath}");

Env.Load(envPath);
builder.Configuration.AddEnvironmentVariables();


// 2️⃣ Configure strongly-typed settings
builder.Services.AddOptions<MongoDbSettings>()
    .Bind(builder.Configuration.GetSection("MongoDb"))
    .Validate(s => !string.IsNullOrWhiteSpace(s.ConnectionString), "MongoDb:ConnectionString missing")
    .Validate(s => !string.IsNullOrWhiteSpace(s.DatabaseName), "MongoDb:DatabaseName missing")
    .ValidateOnStart();

builder.Services.AddOptions<JwtSettings>()
    .Bind(builder.Configuration.GetSection("Jwt"))
    .Validate(s => !string.IsNullOrWhiteSpace(s.Issuer), "Jwt:Issuer missing")
    .Validate(s => !string.IsNullOrWhiteSpace(s.Audience), "Jwt:Audience missing")
    .Validate(s => !string.IsNullOrWhiteSpace(s.Key) && s.Key.Length >= 32, "Jwt:Key must be at least 32 chars")
    .ValidateOnStart();

builder.Services.AddOptions<EmailSettings>()
    .Bind(builder.Configuration.GetSection("Email"))
    .ValidateDataAnnotations()
    .ValidateOnStart();


// 3️⃣ MongoDB
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


// 4️⃣ Dependency Injection
builder.Services.AddSingleton<UserRepository>();
builder.Services.AddSingleton<TodoRepository>();

builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddSingleton<EmailService>();

builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<TodoService>();
builder.Services.AddSingleton<BudgetService>();

builder.Services.AddSingleton<FileStorageService>();


// 5️⃣ File upload limits
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB
});


// 6️⃣ Controllers & Swagger
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opt.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        opt.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        opt.JsonSerializerOptions.IncludeFields = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


// 7️⃣ CORS
var frontendOrigin =
    builder.Configuration["Frontend:Origin"] ?? "http://localhost:3000";

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("DevCors", policy =>
        policy.WithOrigins(frontendOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});


// 8️⃣ JWT Authentication
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()!;
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


// -------------------------
// BUILD APP
// -------------------------
var app = builder.Build();


// 9️⃣ Ensure wwwroot exists
var webRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");

if (!Directory.Exists(webRoot))
{
    Directory.CreateDirectory(webRoot);
}


// Mongo health check
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();
    var result = db.RunCommand<BsonDocument>(new BsonDocument("ping", 1));
    Console.WriteLine("MongoDB connection OK: " + result.ToJson());
}


// -------------------------
// MIDDLEWARE
// -------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Static files
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(webRoot),
    RequestPath = ""
});

app.UseRouting();

app.UseCors("DevCors");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();