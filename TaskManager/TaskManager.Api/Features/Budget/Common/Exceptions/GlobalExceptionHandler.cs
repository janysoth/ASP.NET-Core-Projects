using Microsoft.AspNetCore.Diagnostics;

namespace TaskManager.Api.Common.Exceptions;

/*===========================================================
  GlobalExceptionHandler:
  => Handles unhandled exceptions from the entire API.
  => Converts exceptions into consistent JSON responses.
  => Prevents stack traces from being returned to clients.

  Current exception mappings:

  ArgumentException
  => 400 Bad Request

  KeyNotFoundException
  => 404 Not Found

  InvalidOperationException
  => 409 Conflict

  UnauthorizedAccessException
  => 403 Forbidden

  Unexpected exception
  => 500 Internal Server Error
===========================================================*/
public sealed class GlobalExceptionHandler
  : IExceptionHandler
{
  private readonly ILogger<GlobalExceptionHandler>
    _logger;

  /*===========================================================
    GlobalExceptionHandler Constructor
  ===========================================================*/
  public GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger)
  {
    _logger =
      logger;
  }

  /*===========================================================
    TryHandleAsync:
    => Receives an exception that was not handled elsewhere.
    => Selects the correct HTTP status code.
    => Returns a standardized ErrorResponse.
  ===========================================================*/
  public async ValueTask<bool> TryHandleAsync(
    HttpContext httpContext,
    Exception exception,
    CancellationToken cancellationToken)
  {
    /*---------------------------------------------------------
      Determine the response status and message
    ---------------------------------------------------------*/
    var errorDetails =
      GetErrorDetails(
        exception);

    /*---------------------------------------------------------
      Expected business and validation exceptions are logged
      as warnings.

      Unexpected exceptions are logged as errors with their
      full stack traces.
    ---------------------------------------------------------*/
    if (errorDetails.StatusCode >=
        StatusCodes.Status500InternalServerError)
    {
      _logger.LogError(
        exception,
        "An unexpected error occurred while processing {Method} {Path}.",
        httpContext.Request.Method,
        httpContext.Request.Path);
    }
    else
    {
      _logger.LogWarning(
        exception,
        "Request failed with status {StatusCode} while processing {Method} {Path}.",
        errorDetails.StatusCode,
        httpContext.Request.Method,
        httpContext.Request.Path);
    }

    /*---------------------------------------------------------
      Set the HTTP response
    ---------------------------------------------------------*/
    httpContext.Response.StatusCode =
      errorDetails.StatusCode;

    httpContext.Response.ContentType =
      "application/json";

    /*---------------------------------------------------------
      Return the standard JSON error response
    ---------------------------------------------------------*/
    await httpContext.Response.WriteAsJsonAsync(
      new ErrorResponse
      {
        Message =
          errorDetails.Message
      },
      cancellationToken);

    /*
      Returning true tells ASP.NET Core that the exception
      was successfully handled.
    */
    return true;
  }

  /*===========================================================
    GetErrorDetails:
    => Maps exception types to HTTP status codes and messages.
    => Does not expose internal details for unexpected errors.
  ===========================================================*/
  private static ExceptionResponseDetails
    GetErrorDetails(
      Exception exception)
  {
    return exception switch
    {
      ArgumentException =>
        new ExceptionResponseDetails
        {
          StatusCode =
            StatusCodes.Status400BadRequest,

          Message =
            exception.Message
        },

      KeyNotFoundException =>
        new ExceptionResponseDetails
        {
          StatusCode =
            StatusCodes.Status404NotFound,

          Message =
            exception.Message
        },

      InvalidOperationException =>
        new ExceptionResponseDetails
        {
          StatusCode =
            StatusCodes.Status409Conflict,

          Message =
            exception.Message
        },

      UnauthorizedAccessException =>
        new ExceptionResponseDetails
        {
          StatusCode =
            StatusCodes.Status403Forbidden,

          Message =
            exception.Message
        },

      _ =>
        new ExceptionResponseDetails
        {
          StatusCode =
            StatusCodes.Status500InternalServerError,

          Message =
            "An unexpected server error occurred."
        }
    };
  }

  /*===========================================================
    ExceptionResponseDetails:
    => Internal object used to carry the selected status code
       and safe response message.
  ===========================================================*/
  private sealed record ExceptionResponseDetails
  {
    public int StatusCode { get; init; }

    public string Message { get; init; } =
      string.Empty;
  }
}