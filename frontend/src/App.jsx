import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import Header from './components/Header'
import SuperAdminPanel from './components/SuperAdminPanel'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { ApiService } from './services/api'
import './App.css'

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [error, setError] = useState(null)
  const [currentView, setCurrentView] = useState('dashboard')

  // Check backend connection on startup
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      await ApiService.getHealth()
      setIsConnected(true)
      setError(null)
    } catch (err) {
      setIsConnected(false)
      setError('Unable to connect to the IoT backend. Please ensure the backend server is running on port 5001.')
      console.error('Connection check failed:', err)
    } finally {
      setIsChecking(false)
    }
  }

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connecting to IoT System</h2>
          <p className="text-slate-300">Checking backend connectivity...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (!isConnected && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20 max-w-lg w-full">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Connection Error</h1>
          <p className="text-slate-600 mb-6">Unable to connect to the IoT backend server</p>
          
          <div className="text-left bg-slate-50/80 backdrop-blur-sm p-4 rounded-lg mb-6 border border-slate-200/50">
            <h3 className="font-semibold text-slate-700 mb-2">Troubleshooting steps:</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span>Ensure the backend server is running</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span>Check that port 5001 is accessible</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span>Verify the IoT simulator is connected</span>
              </li>
            </ul>
          </div>
          
          <button
            onClick={checkConnection}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  // Main application with authentication
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-slate-800">
          <Header onViewChange={setCurrentView} currentView={currentView} />
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'super-admin' && <SuperAdminPanel />}
        </div>
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App