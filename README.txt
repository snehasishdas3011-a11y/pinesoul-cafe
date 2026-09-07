PINESOUL CAFE — GOOGLE SHEETS RESERVATION VERSION

1. Open index.html in VS Code.
2. Keep the Images folder beside index.html.
3. The reservation form is already connected to the Google Apps Script /exec URL supplied by you.
4. Make sure your Google Sheet tab is named exactly: Reservations
5. To test reservations, use the website form and then check the Reservations sheet.
6. If you change/redeploy the Apps Script URL, update RESERVATION_ENDPOINT in script.js.


Reservation submission fix:
The website now sends reservations with a native POST form into a hidden iframe instead of fetch/no-cors. Keep the Apps Script Web App deployed as Execute as Me and access Anyone.
