using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Bson;
using MongoDB.Driver;
using TaskManager.Api.Auth;
using TaskManager.Api.Features.Budget.Services;
using TaskManager.Api.Repositories;
using TaskManager.Api.Services;
using TaskManager.Api.Settings;

var builder = WebApplication.CreateBuilder(args);

/*===========================================================
  Load environment variables:
  => Loads the .env file from the API project directory.
  => Adds its values to ASP.NET configuration.
===========================================================*/
var envPath = Path.Combine(
  builder.Environment.ContentRootPath,
  ".env");

if (!File.Exists(envPath))
{
    throw new InvalidOperationException(
      $".env file not found at: {envPath}");
}

Env.Load(envPath);
builder.Configuration.AddEnvironmentVariables();

/*===========================================================
  MongoDB settings:
  => Binds MongoDB configuration to MongoDbSettings.
  => Validates required values when the application starts.
===========================================================*/
builder.Services
  .AddOptions<MongoDbSettings>()
  .Bind(builder.Configuration.GetSection("MongoDb"))
  .Validate(
    settings =>
      !string.IsNullOrWhiteSpace(
        settings.ConnectionString),
    "MongoDb:ConnectionString missing")
  .Validate(
    settings =>
      !string.IsNullOrWhiteSpace(
        settings.DatabaseName),
    "MongoDb:DatabaseName missing")
  .ValidateOnStart();

/*===========================================================
  JWT settings:
  => Binds JWT configuration to JwtSettings.
  => Validates issuer, audience, and secret key.
===========================================================*/
builder.Services
  .AddOptions<JwtSettings>()
  .Bind(builder.Configuration.GetSection("Jwt"))
  .Validate(
    settings =>
      !string.IsNullOrWhiteSpace(settings.Issuer),
    "Jwt:Issuer missing")
  .Validate(
    settings =>
      !string.IsNullOrWhiteSpace(settings.Audience),
    "Jwt:Audience missing")
  .Validate(
    settings =>
      !string.IsNullOrWhiteSpace(settings.Key) &&
      settings.Key.Length >= 32,
    "Jwt:Key must be at least 32 chars")
  .ValidateOnStart();

/*===========================================================
  Email settings:
  => Binds and validates email configuration.
===========================================================*/
builder.Services
  .AddOptions<EmailSettings>()
  .Bind(builder.Configuration.GetSection("Email"))
  .ValidateDataAnnotations()
  .ValidateOnStart();

/*===========================================================
  MongoDB client:
  => Creates one shared MongoClient for the application.
===========================================================*/
builder.Services.AddSingleton<IMongoClient>(
  serviceProvider =>
  {
      var settings = serviceProvider
        .GetRequiredService<IOptions<MongoDbSettings>>()
        .Value;

      return new MongoClient(settings.ConnectionString);
  });

/*===========================================================
  MongoDB database:
  => Retrieves the configured MongoDB database.
  => Injected into repositories and services.
===========================================================*/
builder.Services.AddSingleton<IMongoDatabase>(
  serviceProvider =>
  {
      var settings = serviceProvider
        .GetRequiredService<IOptions<MongoDbSettings>>()
        .Value;

      var client = serviceProvider
        .GetRequiredService<IMongoClient>();

      return client.GetDatabase(settings.DatabaseName);
  });

/*===========================================================
  Existing Task Manager dependencies:
  => Registers repositories and services used by auth and todos.
===========================================================*/
builder.Services.AddSingleton<UserRepository>();
builder.Services.AddSingleton<TodoRepository>();

builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddSingleton<EmailService>();
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<TodoService>();
builder.Services.AddSingleton<FileStorageService>();

/*===========================================================
  Budget and finance dependencies:
  => Registers the smaller services created during the refactor.
  => Each service has one primary responsibility.
===========================================================*/
builder.Services.AddSingleton<BudgetMonthService>();
builder.Services.AddSingleton<BudgetCategoryService>();
builder.Services.AddSingleton<IncomeService>();
builder.Services.AddSingleton<ExpenseService>();
builder.Services.AddSingleton<AccountService>();
builder.Services.AddSingleton<TransferService>();
builder.Services.AddSingleton<TransactionService>();
builder.Services.AddSingleton<BillService>();
builder.Services.AddSingleton<RecurringBillTemplateService>();
builder.Services.AddSingleton<DashboardService>();
builder.Services.AddSingleton<BudgetAdminService>();
builder.Services.AddSingleton<BudgetIndexService>();

/*===========================================================
  File upload limits:
  => Allows multipart uploads up to 10 MB.
===========================================================*/
builder.Services.Configure<FormOptions>(
  options =>
  {
      options.MultipartBodyLengthLimit =
        10 * 1024 * 1024;
  });

/*===========================================================
  Controllers and JSON settings:
  => Uses camelCase JSON properties.
  => Ignores null response properties.
  => Allows case-insensitive incoming JSON properties.
===========================================================*/
builder.Services
  .AddControllers()
  .AddJsonOptions(options =>
  {
      options.JsonSerializerOptions.PropertyNamingPolicy =
        JsonNamingPolicy.CamelCase;

      options.JsonSerializerOptions.DefaultIgnoreCondition =
        JsonIgnoreCondition.WhenWritingNull;

      options.JsonSerializerOptions.PropertyNameCaseInsensitive =
        true;

      options.JsonSerializerOptions.IncludeFields =
        true;
  });

/*===========================================================
  Swagger:
  => Enables API endpoint documentation and testing.
===========================================================*/
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

/*===========================================================
  CORS:
  => Allows the configured React frontend origin.
===========================================================*/
var frontendOrigin =
  builder.Configuration["Frontend:Origin"]
  ?? "http://localhost:3000";

builder.Services.AddCors(options =>
{
    options.AddPolicy(
      "DevCors",
      policy =>
        policy
          .WithOrigins(frontendOrigin)
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials());
});

/*===========================================================
  JWT authentication:
  => Validates JWT issuer, audience, signature, and expiration.
===========================================================*/
var jwtSettings = builder.Configuration
  .GetSection("Jwt")
  .Get<JwtSettings>()
  ?? throw new InvalidOperationException(
    "JWT settings are missing.");

var signingKey = new SymmetricSecurityKey(
  Encoding.UTF8.GetBytes(jwtSettings.Key));

builder.Services
  .AddAuthentication(
    JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(options =>
  {
      options.TokenValidationParameters =
        new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,

            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,

            ValidateLifetime = true,

            ClockSkew = TimeSpan.FromMinutes(1)
        };
  });

builder.Services.AddAuthorization();

/*===========================================================
  Build the application:
===========================================================*/
var app = builder.Build();

/*===========================================================
  Ensure wwwroot exists:
  => Creates the static-file directory when missing.
===========================================================*/
var webRoot = Path.Combine(
  app.Environment.ContentRootPath,
  "wwwroot");

if (!Directory.Exists(webRoot))
{
    Directory.CreateDirectory(webRoot);
}

/*===========================================================
  MongoDB health check:
  => Confirms that the application can connect to MongoDB.
===========================================================*/
using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider
      .GetRequiredService<IMongoDatabase>();

    var pingResult = await database.RunCommandAsync<BsonDocument>(
      new BsonDocument("ping", 1));

    Console.WriteLine(
      "MongoDB connection OK: " +
      pingResult.ToJson());
}

/*===========================================================
  Budget index migration and creation:
  => Temporarily removes older conflicting indexes.
  => Creates the corrected indexes with descriptive names.
  => Remove ReplaceLegacyBudgetIndexesAsync after one successful run.
===========================================================*/
using (var scope = app.Services.CreateScope())
{
    var budgetIndexService = scope.ServiceProvider
      .GetRequiredService<BudgetIndexService>();

    await budgetIndexService.CreateIndexesAsync();

    Console.WriteLine(
      "Budget indexes created successfully.");
}

/*===========================================================
  Development middleware:
  => Enables Swagger only in development.
===========================================================*/
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

/*===========================================================
  Static files:
  => Serves profile images and uploaded files from wwwroot.
===========================================================*/
app.UseStaticFiles(
  new StaticFileOptions
  {
      FileProvider =
      new PhysicalFileProvider(webRoot),

      RequestPath = ""
  });

app.UseRouting();

app.UseCors("DevCors");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();