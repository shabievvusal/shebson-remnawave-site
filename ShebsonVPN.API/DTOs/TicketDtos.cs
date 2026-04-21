namespace ShebsonVPN.API.DTOs;

public record CreateTicketRequest(string Subject, string Message);
public record ReplyTicketRequest(string Message);

public record TicketMessageDto(int Id, string Body, bool IsFromSupport, DateTime CreatedAt);
public record TicketDto(int Id, string Subject, string Status, DateTime CreatedAt, DateTime UpdatedAt, List<TicketMessageDto> Messages);
public record TicketListItemDto(int Id, string Subject, string Status, DateTime UpdatedAt);
