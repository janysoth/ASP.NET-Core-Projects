using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

/*===========================================================
  TransferService
-------------------------------------------------------------
  Purpose:
    => Manages account transfer records for the Budget module.

  Why:
    => Keeps money movement between financial accounts separate
       from income, expense, category, and budget month logic.

  Responsibilities:
    => Get all account transfers for the current user.
    => Create new account transfers.
    => Partially update account transfers.
    => Delete account transfers.
    => Validate source and destination accounts.

  Inherits:
    => BudgetBaseService
===========================================================*/
public class TransferService : BudgetBaseService
{
  /*===========================================================
    TransferService Constructor
  -------------------------------------------------------------
    Purpose:
      => Creates an instance of TransferService.

    Why:
      => Receives the MongoDB database through dependency
         injection and passes it to BudgetBaseService.

    Parameters:
      => database
         MongoDB database connection provided by Program.cs.

    Process Overview:
      1. Receive IMongoDatabase.
      2. Pass database to BudgetBaseService.
      3. BudgetBaseService initializes shared collections.

    Concepts Used:
      ✓ Dependency Injection
      ✓ Constructor Chaining
      ✓ Inheritance
  ===========================================================*/
  public TransferService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    GetTransfersAsync
  -------------------------------------------------------------
    Purpose:
      => Retrieves all account transfers that belong to the
         current user.

    Why:
      => Allows the frontend to show the user's transfer history.

    Parameters:
      => userId
         The unique identifier of the logged-in user.

    Returns:
      => List<AccountTransferResponse>

         A list of account transfer responses sorted by newest
         transfer date first.

    Business Rules:
      => Only returns transfers owned by the current user.
      => Transfers are sorted newest first.

    MongoDB Operations:
      => Find(AccountTransfers)
      => SortByDescending(TransferDate)
      => ToListAsync()

    Process Overview:
      1. Find all transfers for the current user.
      2. Sort transfers by transfer date descending.
      3. Map transfer models to response DTOs.
      4. Return the transfer response list.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Find()
      ✓ Sorting
      ✓ LINQ
      ✓ Select()
      ✓ Mapper Pattern
      ✓ DTO Pattern
      ✓ Ownership Filtering
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

    return transfers
      .Select(TransferMapper.ToResponse)
      .ToList();
  }

  /*===========================================================
    CreateTransferAsync
  -------------------------------------------------------------
    Purpose:
      => Creates a new transfer between two financial accounts.

    Why:
      => Allows the user to record money moving from one account
         to another, such as checking to savings or checking to
         credit card payment.

    Parameters:
      => request
         Data sent from the frontend to create the transfer.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => AccountTransferResponse?

         The created transfer response if successful.
         null if either account is invalid.

    Business Rules:
      => The from account must belong to the current user.
      => The to account must belong to the current user.
      => CreatedAtUtc is set by the backend.

    MongoDB Operations:
      => Find(FinancialAccounts)
      => FirstOrDefaultAsync()
      => InsertOneAsync(AccountTransfers)

    Validation:
      => Uses AccountExistsAsync() to verify FromAccountId.
      => Uses AccountExistsAsync() to verify ToAccountId.

    Process Overview:
      1. Check if the from account exists for the current user.
      2. Check if the to account exists for the current user.
      3. Return null if either account is invalid.
      4. Create a new AccountTransfer model.
      5. Save the transfer to MongoDB.
      6. Map and return the transfer response.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ InsertOneAsync()
      ✓ DTO Pattern
      ✓ Mapper Pattern
      ✓ Object Initializer
      ✓ Guard Clause
      ✓ Ownership Validation
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

    return TransferMapper.ToResponse(transfer);
  }

  /*===========================================================
    PatchTransferAsync
  -------------------------------------------------------------
    Purpose:
      => Partially updates an existing account transfer.

    Why:
      => Allows the user to update only the transfer fields they
         changed instead of sending the full transfer object.

    Parameters:
      => transferId
         The transfer id being patched.

      => request
         Data sent from the frontend with optional updated fields.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => AccountTransferResponse?

         The updated transfer response if successful.
         The original transfer response if no fields were provided.
         null if the transfer or selected accounts are invalid.

    Business Rules:
      => User can only patch their own transfer.
      => Only fields included in the patch request are updated.
      => If FromAccountId is included, it must belong to the user.
      => If ToAccountId is included, it must belong to the user.
      => A transfer cannot have the same from and to account.
      => If no update fields are provided, the existing transfer
         response is returned without modifying MongoDB.

    MongoDB Operations:
      => Find(AccountTransfers)
      => FirstOrDefaultAsync()
      => Find(FinancialAccounts)
      => FirstOrDefaultAsync()
      => Builders<AccountTransfer>.Update.Set()
      => Builders<AccountTransfer>.Update.Combine()
      => UpdateOneAsync(AccountTransfers)

    Validation:
      => Finds the transfer before patching.
      => Validates FromAccountId only when it is included.
      => Validates ToAccountId only when it is included.
      => Checks the final from and to accounts after combining
         existing values with patch values.

    Process Overview:
      1. Find the existing transfer.
      2. Return null if the transfer is not found.
      3. Create an empty update definition list.
      4. Validate FromAccountId if provided.
      5. Validate ToAccountId if provided.
      6. Determine final from and to account ids.
      7. Return null if both account ids are the same.
      8. Add update definitions for provided fields.
      9. Return the original response if no updates were provided.
      10. Combine all update definitions.
      11. Update the transfer in MongoDB.
      12. Reload and return the updated transfer response.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Patch Pattern
      ✓ Optional Properties
      ✓ Null-Coalescing Operator
      ✓ UpdateDefinition<T>
      ✓ Update.Combine()
      ✓ List<T>
      ✓ HasValue
      ✓ Guard Clause
      ✓ DTO Pattern
      ✓ Mapper Pattern
      ✓ Ownership Validation
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
      return TransferMapper.ToResponse(transfer);
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
  -------------------------------------------------------------
    Purpose:
      => Deletes an existing account transfer.

    Why:
      => Allows the user to remove incorrect or unwanted transfer
         records from their budget accounts.

    Parameters:
      => transferId
         The transfer id being deleted.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => AccountTransferResponse?

         The deleted transfer response if successful.
         null if the transfer does not exist or does not belong
         to the current user.

    Business Rules:
      => User can only delete their own transfer.
      => The transfer response is built from the record before
         deletion.
      => Deleting a transfer affects calculated account balances
         when accounts are loaded again.

    MongoDB Operations:
      => Find(AccountTransfers)
      => FirstOrDefaultAsync()
      => DeleteOneAsync(AccountTransfers)

    Validation:
      => Searches by transferId and userId before deleting.
      => Returns null if the transfer record is not found.

    Process Overview:
      1. Find the transfer by transferId and userId.
      2. Return null if the transfer is not found.
      3. Delete the transfer from MongoDB.
      4. Return the deleted transfer response.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Find()
      ✓ FirstOrDefaultAsync()
      ✓ DeleteOneAsync()
      ✓ DTO Pattern
      ✓ Mapper Pattern
      ✓ Guard Clause
      ✓ Ownership Validation
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

    return TransferMapper.ToResponse(transfer);
  }
}