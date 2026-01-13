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
  private readonly TodoService _todos;
  public TodosController(TodoService todos) => _todos = todos;

  private string UserId =>
      User.FindFirstValue(ClaimTypes.NameIdentifier)
      ?? throw new InvalidOperationException("Missing user id claim.");

  [HttpGet]
  public async Task<ActionResult<List<TodoResponse>>> GetAll()
      => Ok(await _todos.GetAllAsync(UserId));

  [HttpPost]
  public async Task<ActionResult<TodoResponse>> Create(TodoCreateRequest req)
  {
    try { return Ok(await _todos.CreateAsync(UserId, req)); }
    catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
  }

  [HttpPut("{id}")]
  public async Task<ActionResult<TodoResponse>> Update(string id, TodoUpdateRequest req)
  {
    try { return Ok(await _todos.UpdateAsync(UserId, id, req)); }
    catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    catch (KeyNotFoundException) { return NotFound(new { error = "Todo not found." }); }
  }

  [HttpDelete("{id}")]
  public async Task<IActionResult> Delete(string id)
  {
    await _todos.DeleteAsync(UserId, id);
    return NoContent();
  }
}
