# MapRi - Collaborative Map PWA

A Progressive Web App that lets you and your friends collaborate on a map and share places like restaurants, bars, cafes, and other attractions.

## Features

- 📱 Progressive Web App - works offline and can be installed on mobile devices
- 🗺️ Interactive map interface using Leaflet
- 📍 Add and view places with different categories (restaurants, bars, cafes, etc.)
- 👥 Collaborative - share places with friends
- 🧑‍💼 Simple user profiles without authentication
- 💾 Local storage for persisting data

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Yarn or npm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/mapri.git
cd mapri
```

2. Install dependencies:

```bash
yarn install
# or
npm install
```

3. Start the development server:

```bash
yarn dev
# or
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Building for Production

To build the app for production:

```bash
yarn build
# or
npm run build
```

This will generate a `dist` directory with the production-ready files.

## Deployment

You can deploy the contents of the `dist` directory to any static hosting service like Netlify, Vercel, GitHub Pages, etc.

## How to Use

1. **Adding Places**:
   - Click on the "+" button in the bottom right corner
   - Click on the map to select a location
   - Fill out the place details (name, description, type)
   - Click "Add Place" to save

2. **User Profile**:
   - Click on the user icon in the bottom right corner
   - Set your display name
   - View your assigned color

3. **Sharing with Friends**:
   - Simply share the URL with your friends
   - All places are shared automatically when they visit the app

## Technical Details

- React 19 with TypeScript
- Leaflet and React-Leaflet for the map interface
- TailwindCSS for styling
- Local storage for data persistence

## Future Improvements

- Backend integration for persistent storage across devices
- User authentication and accounts
- Real-time collaboration features
- Filtering and search functionality
- Directions and navigation
- Comments and ratings for places

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Leaflet](https://leafletjs.com/) for the interactive maps
- [OpenStreetMap](https://www.openstreetmap.org/) for map data
- [TailwindCSS](https://tailwindcss.com/) for styling
- [React](https://reactjs.org/) for the UI framework
