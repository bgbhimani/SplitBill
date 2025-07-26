# Splitwise Clone - Frontend

A React-based frontend application for splitting expenses with friends and family, built with modern web technologies.

## Features

- **User Authentication**: Secure login and registration system
- **Responsive Design**: Mobile-first approach using Tailwind CSS
- **Expense Management**: Add, edit, and delete shared expenses
- **Group Management**: Create and manage expense groups
- **Balance Tracking**: View who owes what and settle debts
- **Real-time Updates**: Live balance calculations

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication
- **Context API** - State management for authentication

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API server running (see backend documentation)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd splitwise-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your API URL:
```
VITE_API_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/
│   └── auth/          # Authentication components
├── context/           # React Context providers
├── pages/             # Main page components
├── services/          # API service functions
├── utils/             # Utility functions
├── App.jsx            # Main App component
└── main.jsx           # Entry point
```

## API Integration

The frontend integrates with the Node.js backend API for:

- User authentication (login/register)
- Group management
- Expense tracking
- Balance calculations
- Payment recording

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `VITE_APP_NAME` | Application name | `Splitwise Clone` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
