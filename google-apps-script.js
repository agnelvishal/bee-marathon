/**
 * Google Apps Script - World Bee Day Marathon Registration Backend
 * 
 * Instructions:
 * 1. Open Google Sheets (https://sheets.google.com).
 * 2. Create a new blank spreadsheet (or use an existing one).
 * 3. Go to "Extensions" -> "Apps Script" in the top menu.
 * 4. Delete any existing code in the editor, and paste this entire code blocks.
 * 5. Click the "Save" icon (or press Ctrl+S / Cmd+S).
 * 6. Click the "Deploy" button -> select "New deployment".
 * 7. Click the gear icon next to "Select type" and select "Web app".
 * 8. Set the fields:
 *    - Description: "Bee Marathon Registration API"
 *    - Execute as: "Me (your-email@gmail.com)"
 *    - Who has access: "Anyone" (Crucial! Otherwise the web page cannot post data)
 * 9. Click "Deploy". You may need to "Authorize access" for the script.
 * 10. Copy the generated "Web app URL" (it ends with /exec) and paste it into `js/app.js` under the `GOOGLE_SCRIPT_URL` variable.
 */

// Handle POST requests from the website form
function doPost(e) {
  // Obtain a script lock to prevent race conditions when multiple users submit simultaneously
  var lock = LockService.getScriptLock();
  
  // Wait up to 10 seconds for the lock to become available
  try {
    lock.waitLock(10000);
  } catch (error) {
    return createJsonResponse("error", "Database busy. Please try again in a few seconds.");
  }
  
  try {
    // Open the default sheet of the active spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-create headers if the sheet is brand new and empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", 
        "Full Name", 
        "Age", 
        "Gender", 
        "Contact Number", 
        "Emergency Contact Number", 
        "Booth ID", 
        "Agreed to Terms"
      ]);
      // Format headers: Bold, dark gray background, light text, freeze row
      var headerRange = sheet.getRange(1, 1, 1, 8);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#334155");
      headerRange.setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
    }
    
    // Extract parameters passed from the URLSearchParams POST body
    var timestamp = new Date();
    var fullName = e.parameter.fullName || "";
    var age = e.parameter.age || "";
    var gender = e.parameter.gender || "";
    var contactNumber = e.parameter.contactNumber || "";
    var emergencyContact = e.parameter.emergencyContact || "";
    var boothId = e.parameter.boothId || "Direct Web Visit";
    var agreedToTerms = e.parameter.agreedToTerms === "true" ? "Yes" : "No";
    
    // Check required fields (server-side backup validation)
    if (!fullName || !age || !gender || !contactNumber || !emergencyContact) {
      return createJsonResponse("error", "Missing required fields");
    }
    
    // Append the row to our spreadsheet
    sheet.appendRow([
      timestamp,
      fullName,
      Number(age),
      gender,
      contactNumber,
      emergencyContact,
      boothId,
      agreedToTerms
    ]);
    
    // Auto-resize columns to fit content nicely
    var lastRow = sheet.getLastRow();
    if (lastRow % 5 === 0 || lastRow === 2) { // Periodic optimization
      sheet.autoResizeColumns(1, 8);
    }
    
    return createJsonResponse("success", "Registration recorded successfully!");
    
  } catch (error) {
    Logger.log(error.toString());
    return createJsonResponse("error", "Server error: " + error.toString());
    
  } finally {
    // Release the script lock so other requests can execute
    lock.releaseLock();
  }
}

// Handle GET requests (Allows testing the backend in a browser)
function doGet(e) {
  var html = "<html><head><title>Bee Marathon API Status</title>";
  html += "<style>body{font-family:sans-serif;background-color:#0b0f19;color:#f8fafc;padding:40px;text-align:center;}";
  html += ".card{background:#1e293b;padding:30px;border-radius:12px;display:inline-block;border:1px solid #f59e0b;box-shadow:0 10px 25px rgba(0,0,0,0.3);}";
  html += "h1{color:#f59e0b;margin-top:0;} p{color:#94a3b8;}</style></head><body>";
  html += "<div class='card'>";
  html += "<h1>🐝 Google Sheets Backend Connected</h1>";
  html += "<p>Your World Bee Day Marathon database script is active and ready to receive submissions.</p>";
  html += "<p><strong>Status:</strong> Online (HTTP POST listener is active)</p>";
  html += "</div></body></html>";
  
  return ContentService.createTextOutput(html).setMimeType(ContentService.MimeType.HTML);
}

// Utility function to generate a JSON response with proper CORS headers
function createJsonResponse(status, message) {
  var result = JSON.stringify({
    status: status,
    message: message
  });
  
  return ContentService.createTextOutput(result)
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
}
