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
    var fromEmail = _config["Email:From"];
    var password = _config["Email:Password"];
    var host = _config["Email:SmtpHost"];
    var port = int.Parse(_config["Email:SmtpPort"]);

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