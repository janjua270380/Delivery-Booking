#  Integrating Your Delivery Calculator with Webador

## Overview
Webador is a website builder that allows you to add custom HTML, CSS, and JavaScript to your site. To integrate your delivery calculator, you'll need to export and adapt specific parts of the application.

## Method 1: Using Webador's HTML Element

1. **Create an HTML Element in Webador**
   - In your Webador dashboard, add a new HTML element to the page where you want the calculator
   - This will allow you to add custom code

2. **Add Required Scripts**
   - First, add the Google Maps API script:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places,geometry"></script>
   ```
   Replace `YOUR_API_KEY` with your actual Google Maps API key

3. **Add CSS Styles**
   - Copy the Tailwind classes or convert them to regular CSS
   - Add the CSS to the HTML element's `<style>` section

4. **Add the HTML Structure**
   - Copy the relevant JSX structure from the React components and convert to HTML
   - Focus on the form fields, map container, and results display

5. **Add JavaScript**
   - Convert the React functions to vanilla JavaScript
   - Implement the distance calculation, price calculation, and form handling

## Method 2: Using an Embedded iFrame

1. **Deploy Your React App to Netlify or Vercel**
   - Build your React application: `npm run build`
   - Deploy the build folder to a hosting service like Netlify or Vercel

2. **Embed the App in Webador**
   - Add an iFrame element in Webador
   - Set the source to your deployed app URL:
   ```html
   <iframe src="https://your-deployed-app-url.netlify.app" width="100%" height="800px" frameborder="0"></iframe>
   ```

3. **Customize the iFrame**
   - Adjust width and height as needed
   - Add any required attributes for responsiveness

## Method 3: Using Webador's JavaScript Integration

1. **Create a Simplified Version**
   - Create a simplified JavaScript version of your calculator
   - Focus on the core functionality (distance calculation and pricing)

2. **Add to Webador's JavaScript Section**
   - In Webador, go to the site settings and find the JavaScript integration section
   - Paste your simplified JavaScript code

3. **Create HTML Structure in Webador**
   - Build the form and results display in Webador's editor
   - Add appropriate IDs and classes for your JavaScript to target

## Google Sheets Integration

For the Google Sheets integration on Webador:

1. **Set Up Google Sheets and Apps Script** as described in your current implementation

2. **Adjust the API Call**
   - When making the API call to Google Sheets, ensure you're using the correct endpoint
   - Example code for Webador:
   ```javascript
   async function saveBookingToGoogleSheets(bookingData) {
     const googleSheetsUrl = "YOUR_GOOGLE_SCRIPT_WEB_APP_URL";
     
     try {
       const response = await fetch(googleSheetsUrl, {
         method: 'POST',
         body: JSON.stringify(bookingData),
         headers: {
           'Content-Type': 'application/json'
         }
       });
       
       if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
       }
       
       const result = await response.json();
       console.log('Booking saved to Google Sheets:', result);
       return result;
     } catch (error) {
       console.error('Error saving to Google Sheets:', error);
       throw error;
     }
   }
   ```

## Important Considerations

1. **API Keys Security**
   - Keep your Google Maps API key restricted to your Webador domain
   - Set up proper HTTP referrer restrictions

2. **Testing**
   - Test thoroughly before making the integration live
   - Check for responsive behavior across different devices

3. **Performance**
   - Optimize any images or scripts to maintain good site performance
   - Consider loading scripts asynchronously

4. **Cross-Origin Issues**
   - Be aware of potential CORS issues when making API requests
   - You may need to adjust your Google Apps Script to handle CORS properly

By following these guidelines, you can successfully integrate your delivery calculator into your Webador website while maintaining its functionality and user experience.
 