using CocosGram.Server.Configuration;
using CocosGram.Server.Domain;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace CocosGram.Server.Persistence;

public sealed class MongoContext
{
    public MongoContext(IOptions<MongoOptions> options)
    {
        var client = new MongoClient(options.Value.ConnectionString);
        Database = client.GetDatabase(options.Value.DatabaseName);
        Users = Database.GetCollection<UserDocument>("users");
        Sessions = Database.GetCollection<SessionDocument>("sessions");
        EmailCodes = Database.GetCollection<EmailCodeDocument>("email_codes");
        Posts = Database.GetCollection<PostDocument>("posts");
        Chats = Database.GetCollection<ChatDocument>("chats");
        Messages = Database.GetCollection<MessageDocument>("messages");
        VerificationRequests = Database.GetCollection<VerificationRequestDocument>("verification_requests");
    }

    public IMongoDatabase Database { get; }
    public IMongoCollection<UserDocument> Users { get; }
    public IMongoCollection<SessionDocument> Sessions { get; }
    public IMongoCollection<EmailCodeDocument> EmailCodes { get; }
    public IMongoCollection<PostDocument> Posts { get; }
    public IMongoCollection<ChatDocument> Chats { get; }
    public IMongoCollection<MessageDocument> Messages { get; }
    public IMongoCollection<VerificationRequestDocument> VerificationRequests { get; }

    public async Task InitializeAsync()
    {
        await Users.Indexes.CreateManyAsync([
            new CreateIndexModel<UserDocument>(Builders<UserDocument>.IndexKeys.Ascending(x => x.Email), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<UserDocument>(Builders<UserDocument>.IndexKeys.Ascending(x => x.Username), new CreateIndexOptions { Unique = true, Sparse = true }),
            new CreateIndexModel<UserDocument>(Builders<UserDocument>.IndexKeys.Ascending(x => x.GoogleSubject), new CreateIndexOptions { Sparse = true })
        ]);
        await Sessions.Indexes.CreateOneAsync(new CreateIndexModel<SessionDocument>(
            Builders<SessionDocument>.IndexKeys.Ascending(x => x.TokenHash),
            new CreateIndexOptions { Unique = true }));
        await EmailCodes.Indexes.CreateManyAsync([
            new CreateIndexModel<EmailCodeDocument>(Builders<EmailCodeDocument>.IndexKeys.Ascending(x => x.Email)),
            new CreateIndexModel<EmailCodeDocument>(Builders<EmailCodeDocument>.IndexKeys.Ascending(x => x.ExpiresAtUtc), new CreateIndexOptions { ExpireAfter = TimeSpan.Zero })
        ]);
        await Posts.Indexes.CreateOneAsync(new CreateIndexModel<PostDocument>(Builders<PostDocument>.IndexKeys.Descending(x => x.CreatedAtUtc)));
        await Chats.Indexes.CreateOneAsync(new CreateIndexModel<ChatDocument>(Builders<ChatDocument>.IndexKeys.Ascending(x => x.MemberIds)));
        await Messages.Indexes.CreateManyAsync([
            new CreateIndexModel<MessageDocument>(Builders<MessageDocument>.IndexKeys.Ascending(x => x.ChatId).Ascending(x => x.CreatedAtUtc)),
            new CreateIndexModel<MessageDocument>(Builders<MessageDocument>.IndexKeys.Descending(x => x.CreatedAtUtc))
        ]);
        await VerificationRequests.Indexes.CreateOneAsync(new CreateIndexModel<VerificationRequestDocument>(
            Builders<VerificationRequestDocument>.IndexKeys.Ascending(x => x.Status).Descending(x => x.CreatedAtUtc)));
    }
}
