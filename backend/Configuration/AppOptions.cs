namespace CocosGram.Server.Configuration;

public sealed class AppOptions
{
    public string PublicBaseUrl { get; set; } = "http://localhost:5000";
    public string FrontendPath { get; set; } = "../../frontend";
    public string[] AdminEmails { get; set; } = [];
}

public sealed class MongoOptions
{
    public string ConnectionString { get; set; } = "mongodb://127.0.0.1:27017";
    public string DatabaseName { get; set; } = "cocosgram";
}

public sealed class GoogleOptions
{
    public string ClientId { get; set; } = "";
    public string ClientSecret { get; set; } = "";
}

public sealed class SmtpOptions
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public string UserName { get; set; } = "";
    public string Password { get; set; } = "";
    public string FromEmail { get; set; } = "noreply@cocosgram.com";
    public string FromName { get; set; } = "CocosGram";
    public bool EnableSsl { get; set; } = true;
}
