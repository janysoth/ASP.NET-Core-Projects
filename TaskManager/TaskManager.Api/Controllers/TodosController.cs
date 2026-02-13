using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Dtos;
using TaskManager.Api.Services;

namespace TaskManager.Api.Controllers;

[ApiController]
[Route("api/todos")]
[Authorize]
public sealed class TodosController : ControllerBase
{
  private readonly TodoService _service;

  public TodosController(TodoService service)
  {
    _service = service;
  }

  private string UserId =>
      User.FindFirstValue(ClaimTypes.NameIdentifier)
      ?? throw new UnauthorizedAccessException();

  [HttpGet]
  public async Task<IActionResult> GetAll()
  {
    var todos = await _service.GetAllAsync(UserId);
    return Ok(todos);
  }

  [HttpGet("{id}")]
  public async Task<IActionResult> GetById(string id)
  {
    var todo = await _service.GetByIdAsync(id, UserId);
    return todo is null ? NotFound() : Ok(todo);
  }

  [Authorize]
  [HttpPost("create-todo")]
  public async Task<IActionResult> Create(TodoCreateRequest request)
  {
    var todo = await _service.CreateAsync(request, UserId);
    return CreatedAtAction(nameof(GetById), new { id = todo.Id }, todo);
  }

  [HttpPut("{id}")]
  public async Task<IActionResult> Update(
      string id,
      TodoUpdateRequest request
  )
  {
    var updated = await _service.UpdateAsync(id, request, UserId);
    return updated ? NoContent() : NotFound();
  }

  [HttpDelete("{id}")]
  public async Task<IActionResult> Delete(string id)
  {
    await _service.DeleteAsync(id, UserId);
    return NoContent();
  }

  [HttpDelete("delete-all")]
  public async Task<IActionResult> DeleteAll()
  {
    await _service.DeleteAllAsync(UserId);
    return NoContent();
  }

  [HttpPatch("{id}")]
  public async Task<IActionResult> PatchUpdate(string id, [FromBody] TodoPatchRequest request)
  {
    if (request == null)
    {
      return BadRequest("Patch request body cannot be null.");
    }

    // Initialize a dictionary to hold updated fields and their new values
    var updatedFields = new Dictionary<string, object>();

    // Update fields conditionally based on what is provided
    if (request.Title != null)
    {
      await _service.PatchUpdateAsync(id, UserId, t => t.Title, request.Title);
      updatedFields["Title"] = request.Title; // Track the updated field
    }

    if (request.Description != null)
    {
      await _service.PatchUpdateAsync(id, UserId, t => t.Description, request.Description);
      updatedFields["Description"] = request.Description; // Track the updated field
    }

    if (request.IsCompleted.HasValue)
    {
      await _service.PatchUpdateAsync(id, UserId, t => t.IsCompleted, request.IsCompleted.Value);
      updatedFields["IsCompleted"] = request.IsCompleted.Value; // Track the updated field
    }

    if (request.DueDateUtc.HasValue)
    {
      await _service.PatchUpdateAsync(id, UserId, t => t.DueDateUtc, request.DueDateUtc.Value);
      updatedFields["DueDateUtc"] = request.DueDateUtc.Value; // Track the updated field
    }

    // Return a response with the updated fields
    return Ok(new
    {
      Message = "Todo updated successfully.",
      UpdatedFields = updatedFields
    });
  }
}
