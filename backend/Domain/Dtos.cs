namespace CocosGram.Server.Domain;

public sealed record AuthResponse(string Token, UserDto User);
public sealed record UserDto(string Id, string Email, string DisplayName, string Username, string AvatarUrl, bool IsVerified, bool IsAdmin, PrivacySettings Privacy);
public sealed record PostDto(string Id, UserDto Author, string Text, string[] ImageUrls, long LikesCount, DateTimeOffset CreatedAtUtc);
public sealed record ChatDto(string Id, UserDto Peer, MessageDto? LastMessage, DateTimeOffset UpdatedAtUtc);
public sealed record MessageDto(string Id, string ChatId, UserDto Sender, string Text, DateTimeOffset CreatedAtUtc, bool IsRead);
public sealed record VerificationRequestDto(string Id, UserDto User, string Reason, string[] Links, string Status, DateTimeOffset CreatedAtUtc);

public sealed record EmailCodeRequest(string Email);
public sealed record EmailVerifyRequest(string Email, string Code, string? DisplayName);
public sealed record UsernameUpdateRequest(string Username);
public sealed record PrivacyUpdateRequest(PrivacySettings Privacy);
public sealed record DirectChatRequest(string UserId);
public sealed record SendMessageRequest(string Text);
public sealed record VerificationApplyRequest(string Reason, string[] Links);
public sealed record VerificationReviewRequest(string Status);
