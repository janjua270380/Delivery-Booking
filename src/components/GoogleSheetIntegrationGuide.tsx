import  { AlertCircle, Info, Database, Check } from 'lucide-react';

export function GoogleSheetIntegrationGuide() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Google Sheets Integration Guide</h2>
      </div>

      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 mb-6">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              In this JDoodle.AI environment, we're using localStorage to simulate a database for demo purposes. 
              For a production environment, you would use Google Sheets as follows:
            </p>
            <p className="text-sm mt-1 text-blue-800 font-medium">
              Try the "View Bookings" button to see your saved bookings in this demo!
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">1. Create a Google Sheet</h3>
          <p className="text-sm text-gray-600 mb-3">
            Start by creating a new Google Sheet with the following columns:
          </p>
          <div className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left text-gray-700">Timestamp</th>
                  <th className="px-2 py-1 text-left text-gray-700">Collection Name</th>
                  <th className="px-2 py-1 text-left text-gray-700">Collection Address</th>
                  <th className="px-2 py-1 text-left text-gray-700">Collection Postcode</th>
                  <th className="px-2 py-1 text-left text-gray-700">Delivery Name</th>
                  <th className="px-2 py-1 text-left text-gray-700">Delivery Address</th>
                  <th className="px-2 py-1 text-left text-gray-700">Delivery Postcode</th>
                  <th className="px-2 py-1 text-left text-gray-700">Delivery Date</th>
                  <th className="px-2 py-1 text-left text-gray-700">Urgent</th>
                  <th className="px-2 py-1 text-left text-gray-700">Base Price</th>
                  <th className="px-2 py-1 text-left text-gray-700">VAT</th>
                  <th className="px-2 py-1 text-left text-gray-700">Total Price</th>
                </tr>
              </thead>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Name the sheet "Delivery Bookings"
          </p>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">2. Create a Google Apps Script</h3>
          <p className="text-sm text-gray-600 mb-3">
            In your Google Sheet, go to Extensions → Apps Script and paste this code:
          </p>
          <div className="bg-gray-800 text-gray-200 p-3 rounded-md text-xs overflow-x-auto">
            <pre className="whitespace-pre-wrap">
{`function doPost(e) {
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
        "Urgent",
        "Base Price",
        "VAT",
        "Total Price"
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
      data.isUrgent,
      data.basePrice,
      data.vat,
      data.totalPrice
    ]);
    
    // Return success response with CORS headers
    const output = ContentService.createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
      
    // Set CORS headers
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
}`}
            </pre>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">3. Deploy as Web App</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="inline-flex justify-center items-center rounded-full bg-blue-100 w-5 h-5 text-xs text-blue-800 font-bold mr-2 flex-shrink-0">1</span>
              <span>Click on "Deploy" → "New deployment"</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex justify-center items-center rounded-full bg-blue-100 w-5 h-5 text-xs text-blue-800 font-bold mr-2 flex-shrink-0">2</span>
              <span>Select "Web app" as the deployment type</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex justify-center items-center rounded-full bg-blue-100 w-5 h-5 text-xs text-blue-800 font-bold mr-2 flex-shrink-0">3</span>
              <span>Set "Who has access" to "Anyone"</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex justify-center items-center rounded-full bg-blue-100 w-5 h-5 text-xs text-blue-800 font-bold mr-2 flex-shrink-0">4</span>
              <span>Click "Deploy"</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex justify-center items-center rounded-full bg-blue-100 w-5 h-5 text-xs text-blue-800 font-bold mr-2 flex-shrink-0">5</span>
              <span>Copy the Web App URL</span>
            </li>
          </ol>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">4. Update the Application Code</h3>
          <p className="text-sm text-gray-600">
            Update the <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-600">googleSheetsUrl</code> in the <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-600">src/utils/storage.ts</code> file with your Web App URL.
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-green-800 mb-2 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            Using the JDoodle Google Sheets Integration
          </h3>
          <p className="text-sm text-green-700 mb-3">
            JDoodle.AI provides a convenient way to integrate with Google Sheets through the proxy server:
          </p>
          <div className="bg-white p-3 rounded-md text-xs overflow-x-auto">
            <pre className="whitespace-pre-wrap">
{`// Using the JDoodle proxy for Google Sheets
const googleSheetsUrl = "YOUR_GOOGLE_SCRIPT_WEB_APP_URL";

const response = await fetch(\`https://hooks.jdoodle.net/proxy?url=\${encodeURIComponent(googleSheetsUrl)}\`, {
  method: 'POST',
  body: JSON.stringify(formattedData),
  headers: {
    'Content-Type': 'application/json'
  }
});`}
            </pre>
          </div>
          <p className="text-sm text-green-700 mt-3">
            This approach handles CORS issues and provides a secure way to connect to your Google Sheets from the JDoodle environment.
          </p>
        </div>

        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 mt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium">Troubleshooting Tips</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-700 mt-1">
                <li>The Google Apps Script needs authorization during the first run</li>
                <li>After changes to the script, you need to create a new deployment</li>
                <li>If getting "Cannot read properties of undefined (reading 'postData')" error when testing directly in the Apps Script editor, this is normal - the script will work properly when called from your application</li>
                <li>Verify you've included the CORS headers in your script</li>
                <li>Check the deployment settings to ensure "Anyone" has access to the web app</li>
                <li>For 401 errors, try creating a new deployment and updating your URL</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 