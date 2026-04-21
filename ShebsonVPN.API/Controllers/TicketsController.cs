using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShebsonVPN.API.Data;
using ShebsonVPN.API.DTOs;
using ShebsonVPN.API.Models;

namespace ShebsonVPN.API.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
public class TicketsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        var tickets = await db.Tickets
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.UpdatedAt)
            .Select(t => new TicketListItemDto(t.Id, t.Subject, t.Status.ToString(), t.UpdatedAt))
            .ToListAsync();
        return Ok(tickets);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var userId = GetUserId();
        var ticket = await db.Tickets
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (ticket is null) return NotFound();

        return Ok(new TicketDto(
            ticket.Id, ticket.Subject, ticket.Status.ToString(),
            ticket.CreatedAt, ticket.UpdatedAt,
            ticket.Messages.OrderBy(m => m.CreatedAt)
                .Select(m => new TicketMessageDto(m.Id, m.Body, m.IsFromSupport, m.CreatedAt))
                .ToList()
        ));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTicketRequest req)
    {
        var userId = GetUserId();
        var ticket = new SupportTicket
        {
            UserId = userId,
            Subject = req.Subject,
            Messages = [new TicketMessage { Body = req.Message, IsFromSupport = false }]
        };
        db.Tickets.Add(ticket);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = ticket.Id }, new { id = ticket.Id });
    }

    [HttpPost("{id}/reply")]
    public async Task<IActionResult> Reply(int id, ReplyTicketRequest req)
    {
        var userId = GetUserId();
        var ticket = await db.Tickets.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (ticket is null) return NotFound();
        if (ticket.Status == TicketStatus.Closed) return BadRequest(new { error = "Тикет закрыт" });

        db.TicketMessages.Add(new TicketMessage { TicketId = id, Body = req.Message, IsFromSupport = false });
        ticket.UpdatedAt = DateTime.UtcNow;
        ticket.Status = TicketStatus.Open;
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/close")]
    public async Task<IActionResult> Close(int id)
    {
        var userId = GetUserId();
        var ticket = await db.Tickets.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (ticket is null) return NotFound();
        ticket.Status = TicketStatus.Closed;
        ticket.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok();
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
