using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class TransferService : BudgetBaseService
{
  /*===========================================================
    TransferService Constructor
  ===========================================================*/
  public TransferService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    Helper Function -- BuildTransferResponseAsync
  ===========================================================*/
  private async Task<AccountTransferResponse> BuildTransferResponseAsync(
  AccountTransfer transfer,
  string userId)
  {
    var fromAccount = await GetAccountByIdAsync(transfer.FromAccountId, userId);
    var toAccount = await GetAccountByIdAsync(transfer.ToAccountId, userId);

    return TransferMapper.ToResponse(transfer, fromAccount, toAccount);
  }

  /*===========================================================
    GetTransfersAsync
  ===========================================================*/
  public async Task<List<AccountTransferResponse>> GetTransfersAsync(
    string userId)
  {
    /*---------------------------------------------------------
      Get user's transfers from MongoDB
    ---------------------------------------------------------*/
    var transfers = await AccountTransfers
      .Find(t => t.UserId == userId)
      .SortByDescending(t => t.TransferDate)
      .ToListAsync();

    /*---------------------------------------------------------
      Map and return response list
    ---------------------------------------------------------*/
    var responses = new List<AccountTransferResponse>();

    foreach (var transfer in transfers)
    {
      responses.Add(await BuildTransferResponseAsync(transfer, userId));
    }

    return responses;
  }

  /*===========================================================
    CreateTransferAsync
  ===========================================================*/
  public async Task<AccountTransferResponse?> CreateTransferAsync(
    CreateAccountTransferRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Validate source and destination accounts
    ---------------------------------------------------------*/
    var fromAccountExists = await AccountExistsAsync(
      request.FromAccountId,
      userId);

    var toAccountExists = await AccountExistsAsync(
      request.ToAccountId,
      userId);

    if (!fromAccountExists || !toAccountExists)
    {
      return null;
    }

    /*---------------------------------------------------------
      Create new transfer model
    ---------------------------------------------------------*/
    var transfer = new AccountTransfer
    {
      UserId = userId,
      FromAccountId = request.FromAccountId,
      ToAccountId = request.ToAccountId,
      Amount = request.Amount,
      TransferDate = request.TransferDate,
      Notes = request.Notes,
      CreatedAtUtc = DateTime.UtcNow
    };

    /*---------------------------------------------------------
      Save transfer to MongoDB
    ---------------------------------------------------------*/
    await AccountTransfers.InsertOneAsync(transfer);

    /*---------------------------------------------------------
      Return response
    ---------------------------------------------------------*/
    return await BuildTransferResponseAsync(transfer, userId);
  }

  /*===========================================================
    PatchTransferAsync
  ===========================================================*/
  public async Task<AccountTransferResponse?> PatchTransferAsync(
    string transferId,
    PatchAccountTransferRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Find existing transfer before patching
    ---------------------------------------------------------*/
    var transfer = await AccountTransfers
      .Find(t => t.Id == transferId && t.UserId == userId)
      .FirstOrDefaultAsync();

    if (transfer == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Build update list from provided fields
    ---------------------------------------------------------*/
    var updates = new List<UpdateDefinition<AccountTransfer>>();

    if (request.FromAccountId != null)
    {
      var fromAccountExists = await AccountExistsAsync(
        request.FromAccountId,
        userId);

      if (!fromAccountExists)
      {
        return null;
      }

      updates.Add(
        Builders<AccountTransfer>.Update.Set(
          t => t.FromAccountId,
          request.FromAccountId));
    }

    if (request.ToAccountId != null)
    {
      var toAccountExists = await AccountExistsAsync(
        request.ToAccountId,
        userId);

      if (!toAccountExists)
      {
        return null;
      }

      updates.Add(
        Builders<AccountTransfer>.Update.Set(
          t => t.ToAccountId,
          request.ToAccountId));
    }

    /*---------------------------------------------------------
      Validate final transfer direction
    ---------------------------------------------------------*/
    var newFromAccountId = request.FromAccountId ?? transfer.FromAccountId;
    var newToAccountId = request.ToAccountId ?? transfer.ToAccountId;

    if (newFromAccountId == newToAccountId)
    {
      return null;
    }

    /*---------------------------------------------------------
      Add optional transfer field updates
    ---------------------------------------------------------*/
    if (request.Amount.HasValue)
    {
      updates.Add(
        Builders<AccountTransfer>.Update.Set(
          t => t.Amount,
          request.Amount.Value));
    }

    if (request.TransferDate.HasValue)
    {
      updates.Add(
        Builders<AccountTransfer>.Update.Set(
          t => t.TransferDate,
          request.TransferDate.Value));
    }

    if (request.Notes != null)
    {
      updates.Add(
        Builders<AccountTransfer>.Update.Set(
          t => t.Notes,
          request.Notes));
    }

    /*---------------------------------------------------------
      Return existing response when nothing changed
    ---------------------------------------------------------*/
    if (updates.Count == 0)
    {
      return await BuildTransferResponseAsync(transfer, userId);
    }

    /*---------------------------------------------------------
      Apply combined update to MongoDB
    ---------------------------------------------------------*/
    await AccountTransfers.UpdateOneAsync(
      t => t.Id == transferId && t.UserId == userId,
      Builders<AccountTransfer>.Update.Combine(updates));

    /*---------------------------------------------------------
      Reload and return updated transfer
    ---------------------------------------------------------*/
    var updatedTransfer = await AccountTransfers
      .Find(t => t.Id == transferId && t.UserId == userId)
      .FirstOrDefaultAsync();

    return updatedTransfer == null
      ? null
      : TransferMapper.ToResponse(updatedTransfer);
  }

  /*===========================================================
    DeleteTransferAsync
  ===========================================================*/
  public async Task<AccountTransferResponse?> DeleteTransferAsync(
    string transferId,
    string userId)
  {
    /*---------------------------------------------------------
      Find transfer before deleting
    ---------------------------------------------------------*/
    var transfer = await AccountTransfers
      .Find(t => t.Id == transferId && t.UserId == userId)
      .FirstOrDefaultAsync();

    if (transfer == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Delete transfer from MongoDB
    ---------------------------------------------------------*/
    await AccountTransfers.DeleteOneAsync(
      t => t.Id == transferId && t.UserId == userId);

    /*---------------------------------------------------------
      Return deleted transfer response
    ---------------------------------------------------------*/
    return await BuildTransferResponseAsync(transfer, userId);
  }
}