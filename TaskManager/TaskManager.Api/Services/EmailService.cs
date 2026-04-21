using System.Net;
using System.Net.Mail;

public sealed class EmailService
{
  private readonly IConfiguration _config;

  public EmailService(IConfiguration config)
  {
    _config = config;
  }

  public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
  {
    var fromEmail = _config["Email:From"]
        ?? throw new InvalidOperationException("Email:From is missing");

    var password = _config["Email:Password"]
        ?? throw new InvalidOperationException("Email:Password is missing");

    var host = _config["Email:SmtpHost"]
        ?? throw new InvalidOperationException("Email:SmtpHost is missing");

    var portString = _config["Email:SmtpPort"]
        ?? throw new InvalidOperationException("Email:SmtpPort is missing");

    if (!int.TryParse(portString, out var port))
      throw new InvalidOperationException("Email:SmtpPort must be a valid number");

    using var client = new SmtpClient(host, port)
    {
      EnableSsl = true,
      Credentials = new NetworkCredential(fromEmail, password)
    };

    var mail = new MailMessage(fromEmail, toEmail, subject, htmlBody)
    {
      IsBodyHtml = true
    };

    await client.SendMailAsync(mail);
  }
}