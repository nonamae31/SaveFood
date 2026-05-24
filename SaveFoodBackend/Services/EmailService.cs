using System;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body, bool isHtml = true)
    {
        var emailSettings = _config.GetSection("SmtpSettings");
        var message = new MimeMessage();
        
        var senderName = emailSettings["SenderName"];
        var senderEmail = emailSettings["SenderEmail"];
        
        message.From.Add(new MailboxAddress(senderName, senderEmail));
        message.To.Add(new MailboxAddress("", toEmail));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder();
        if (isHtml)
        {
            bodyBuilder.HtmlBody = body;
        }
        else
        {
            bodyBuilder.TextBody = body;
        }

        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        
        var host = emailSettings["Host"];
        var port = int.Parse(emailSettings["Port"] ?? "587");
        var enableSsl = bool.Parse(emailSettings["EnableSsl"] ?? "true");
        var username = emailSettings["Username"];
        var password = emailSettings["Password"];

        try
        {
            await client.ConnectAsync(host, port, enableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto);
            await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EMAIL ERROR] Failed to send email to {toEmail}: {ex.Message}");
            throw new InvalidOperationException("Failed to send email. Please try again later.");
        }
        finally
        {
            await client.DisconnectAsync(true);
        }
    }
}
