♻️ SwachhTrack -- Smart City Cleanliness
SwachhTrack is a web-based cleanliness reporting platform that helps
citizens report sanitation issues, choose a location using GPS or an
interactive map, and follow the progress of submitted reports.

🌐 Live Website: https://team-nexgen.github.io/SwachhTrack/
📁 GitHub Repository: https://github.com/TEAM-NEXGEN/SwachhTrack
Features
- Submit cleanliness complaints with name, location, category, and
  description.
- Select a complaint location using GPS or by clicking on the map.
- View submitted reports on an interactive map.
- Search and filter reports by category and status.
- View dashboard counts for total, pending, and resolved reports.
- Admin sign-in using Firebase Authentication.
- Update complaint statuses: Pending, In Progress, and
  Resolved.
- Receive live report updates from Cloud Firestore.
  
Technology Stack
  Technology                Purpose
  HTML5                     Website structure
CSS3                      Styling and layout
JavaScript                Application functionality
Firebase Authentication   Admin sign-in
Cloud Firestore           Store and retrieve reports
Leaflet.js                Interactive map
OpenStreetMap             Map tiles
GitHub Pages              Website hosting

Run Locally
1. Clone this repository:
   git clone https://github.com/TEAM-NEXGEN/SwachhTrack.git
2. Open the downloaded SwachhTrack folder in Visual Studio Code.
3. Configure Firebase in script.js using your own Firebase project's
   web-app configuration.
4. In Firebase Console, enable Email/Password under Authentication
   and create a Cloud Firestore database.
5. Configure Firestore security rules to allow report creation and
   reading while restricting status updates to an authorized
   administrator.
6. Open index.html with the VS Code Live Server extension.
GPS access generally requires HTTPS or localhost and the user's
permission.

Admin Access
The administrator signs in through Firebase Authentication. The
administrator email used in the application must match the email
permitted by the Firestore security rules.

Future Improvements
- Add photo uploads for reported issues.
- Add notifications when report statuses change.
- Add area-wise analytics and reporting.
- Improve mobile usability and accessibility.
- Add further verification and moderation features.
  
Team
Team Nexgen
Purpose
SwachhTrack is an educational project demonstrating how web technologies
and location-based reporting can support community participation in
maintaining cleaner cities.

A cleaner city begins with a responsible citizen. ♻️
