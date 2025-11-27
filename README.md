# Home Helper - Web Frontend

React.js web application for Home Helper - Professional Home Services platform.

This is the web version of the Home Helper application, built with React and Vite. It shares the same backend API as the mobile app (Flutter).

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend server running (see `home_helper_backend`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional - defaults to localhost):
```bash
cp .env.example .env
```

3. Update `.env` if your backend is running on a different URL:
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:3000`

3. Make sure your backend server is running on `http://localhost:3000` (or update the `.env` file)

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## 🎨 Design

The web app uses the same color scheme and design language as the mobile app:

- **Brand Gradient**: Blue (#1E40AF) → Sky Blue (#0EA5E9) → Cyan (#06B6D4) → Teal (#14B8A6) → Orange (#F97316)
- **Primary Color**: Soft Lavender (#7F6BFF)
- **Secondary Color**: Gentle Violet (#8B5CF6)
- **Fonts**: Inter (primary), Poppins (headings)

## 📁 Project Structure

```
home_helper_frontend_web/
├── src/
│   ├── pages/           # Page components
│   │   └── LandingPage.jsx
│   ├── components/      # Reusable components
│   ├── services/        # API services
│   │   └── api.service.js
│   ├── config/          # Configuration files
│   │   └── api.config.js
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── package.json
└── vite.config.js
```

## 🔌 Backend Integration

This web app connects to the same backend as the mobile app:

- **Backend Location**: `home_helper_backend`
- **Default API URL**: `http://localhost:3000/api/v1`
- **API Documentation**: `http://localhost:3000/docs` (when backend is running)

The API service automatically includes authentication tokens from localStorage in requests.

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📝 Notes

- This web app shares the backend with the mobile app
- Make sure the backend is running before using the web app
- The landing page matches the mobile app's splash screen design
- API authentication tokens are stored in localStorage

## 🤝 Contributing

This project is part of the Home Helper ecosystem. Ensure any changes are compatible with the shared backend API.







