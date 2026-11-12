import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './app/providers/AuthProvider'
import { AppRoutes } from './app/routes'
import { FeedbackHost } from './components/FeedbackHost'
import './styles/App.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <FeedbackHost />
      </AuthProvider>
    </BrowserRouter>
  )
}
