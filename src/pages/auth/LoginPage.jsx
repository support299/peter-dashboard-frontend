import { useAuth } from '../../app/providers/AuthProvider'
import { LoginScreen } from '../../features/auth'

export default function LoginPage() {
  const { loginSuccess } = useAuth()
  return <LoginScreen onSuccess={loginSuccess} />
}
