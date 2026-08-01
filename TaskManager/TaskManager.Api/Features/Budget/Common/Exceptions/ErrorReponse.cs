namespace TaskManager.Api.Common.Exceptions;

/*===========================================================
  ErrorResponse:
  => Standard response returned when an API error occurs.
  => Keeps every error response in the same JSON format.

  Example:

  {
    "message": "The requested operation could not be completed."
  }
===========================================================*/
public sealed record ErrorResponse
{
  public string Message { get; init; } =
    string.Empty;
}