/**
  * Google Apps Script to handle form submissions from Webador
 * Deploy this as a web app from the Google Apps Script editor
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  
  try {
    // Get the active spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Delivery Bookings") || ss.getActiveSheet();
    
    // Check if e and e.postData exist
    let data;
    if (e && e.postData) {
      // Parse the incoming data
      data = JSON.parse(e.postData.contents);
    } else {
      // For testing
      return ContentService
        .createTextOutput(JSON.stringify({ result: "error", error: "No data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // If this is the first entry, add headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Collection Name",
        "Collection Address",
        "Collection Postcode",
        "Delivery Name",
        "Delivery Address",
        "Delivery Postcode",
        "Delivery Date",
        "Delivery Time",
        "Urgent",
        "Vehicle Type",
        "Base Price",
        "VAT",
        "Total Price",
        "Contact Email",
        "Contact Phone",
        "Additional Info"
      ]);
    }
    
    // Append the new booking data
    sheet.appendRow([
      new Date().toLocaleString(),
      data.collectionName,
      data.collectionAddress,
      data.collectionPostcode,
      data.deliveryName,
      data.deliveryAddress,
      data.deliveryPostcode,
      data.date,
      data.deliveryTime,
      data.isUrgent,
      data.vehicleType,
      data.basePrice,
      data.vat,
      data.totalPrice,
      data.contactEmail,
      data.contactPhone,
      data.additionalInfo
    ]);
    
    // Return success response with CORS headers
    const output = ContentService.createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
      
    // Set CORS headers for cross-domain requests from Webador
    output.setHeader('Access-Control-Allow-Origin', '*');
    output.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return output;
      
  } catch(error) {
    // Return error response with CORS headers
    const output = ContentService.createTextOutput(JSON.stringify({ 
      result: "error", 
      error: error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
    // Set CORS headers
    output.setHeader('Access-Control-Allow-Origin', '*');
    output.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return output;
      
  } finally {
    // Always release the lock
    lock.releaseLock();
  }
}

// Handle preflight OPTIONS requests for CORS
function doOptions(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  return output;
}
 