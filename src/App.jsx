import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ForgotPassword from './pages/ForgotPassword'
import SignupPage from './pages/SignupPage'
import OtpVerification from './pages/OtpVerification'
import ProviderProfileCompletion from './pages/ProviderProfileCompletion'
import ProviderDashboard from './pages/ProviderDashboard'
import UserDashboard from './pages/UserDashboard'
import InstantBooking from './pages/InstantBooking'
import InstantBookingConfirm from './pages/InstantBookingConfirm'
import ScheduleBooking from './pages/ScheduleBooking'
import ScheduleBookingConfirm from './pages/ScheduleBookingConfirm'
import ProviderProfile from './pages/ProviderProfile'
import UserBookingsHistory from './pages/UserBookingsHistory'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element={<OtpVerification />} />
        <Route path="/provider/complete-profile" element={<ProviderProfileCompletion />} />
        <Route path="/provider/dashboard" element={<ProviderDashboard />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/bookings/history" element={<UserBookingsHistory />} />
        <Route path="/instant-booking" element={<InstantBooking />} />
        <Route path="/booking/instant/confirm" element={<InstantBookingConfirm />} />
        <Route path="/booking/schedule" element={<ScheduleBooking />} />
        <Route path="/booking/schedule/confirm" element={<ScheduleBookingConfirm />} />
        <Route path="/provider/profile" element={<ProviderProfile />} />
      </Routes>
    </Router>
  )
}

export default App
