namespace TaskManager.Api.Exceptions
{
  public class TokenRevokedException : Exception
  {
    public TokenRevokedException(string message) : base(message) { }
  }
}