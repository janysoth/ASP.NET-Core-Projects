namespace TaskManager.Api.Dtos;

public sealed record TodoCreateRequest(string Title, string? Description, DateTime? DueDateUtc);
public sealed record TodoUpdateRequest(string Title, string? Description, bool IsCompleted, DateTime? DueDateUtc);

public sealed record TodoResponse(
    string Id,
    string Title,
    string? Description,
    bool IsCompleted,
    DateTime? DueDateUtc,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc
);
