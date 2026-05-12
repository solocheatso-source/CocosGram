using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CocosGram.Server.Domain;

public sealed class UserDocument
{
    [BsonId]
    public ObjectId Id { get; set; }
    public string Email { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Username { get; set; } = "";
    public string AvatarUrl { get; set; } = "";
    public string GoogleSubject { get; set; } = "";
    public bool IsVerified { get; set; }
    public bool IsAdmin { get; set; }
    public PrivacySettings Privacy { get; set; } = new();
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset LastSeenUtc { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class PrivacySettings
{
    public bool PrivateProfile { get; set; }
    public bool AllowMessagesFromEveryone { get; set; } = true;
    public bool ShowOnline { get; set; } = true;
}

public sealed class SessionDocument
{
    [BsonId]
    public ObjectId Id { get; set; }
    public ObjectId UserId { get; set; }
    public string TokenHash { get; set; } = "";
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAtUtc { get; set; } = DateTimeOffset.UtcNow.AddDays(30);
}

public sealed class EmailCodeDocument
{
    [BsonId]
    public ObjectId Id { get; set; }
    public string Email { get; set; } = "";
    public string CodeHash { get; set; } = "";
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public bool Used { get; set; }
}

public sealed class PostDocument
{
    [BsonId]
    public ObjectId Id { get; set; }
    public ObjectId AuthorId { get; set; }
    public string Text { get; set; } = "";
    public string[] ImageUrls { get; set; } = [];
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public long LikesCount { get; set; }
}

public sealed class ChatDocument
{
    [BsonId]
    public ObjectId Id { get; set; }
    public ObjectId[] MemberIds { get; set; } = [];
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class MessageDocument
{
    [BsonId]
    public ObjectId Id { get; set; }
    public ObjectId ChatId { get; set; }
    public ObjectId SenderId { get; set; }
    public string Text { get; set; } = "";
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public ObjectId[] ReadBy { get; set; } = [];
}

public sealed class VerificationRequestDocument
{
    [BsonId]
    public ObjectId Id { get; set; }
    public ObjectId UserId { get; set; }
    public string Reason { get; set; } = "";
    public string[] Links { get; set; } = [];
    public string Status { get; set; } = VerificationStatuses.Pending;
    public ObjectId? ReviewedBy { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ReviewedAtUtc { get; set; }
}

public static class VerificationStatuses
{
    public const string Pending = "pending";
    public const string Approved = "approved";
    public const string Rejected = "rejected";
}
