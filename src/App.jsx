import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Planner from './pages/Planner';
import AcademicCalendar from './pages/AcademicCalendar';
import Heatmap from './pages/Heatmap';
import FocusRoom from './pages/FocusRoom.jsx';
import Community from './pages/Community';
import StudyCoach from './pages/StudyCoach';
import Insights from './pages/Insights';
import AppLayout from './components/layout/AppLayout';
import GardenFocusRoom from './pages/GardenFocusRoom';
import ResetRoom from './pages/ResetRoom';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/calendar" element={<AcademicCalendar />} />
        <Route path="/heatmap" element={<Heatmap />} />
        <Route path="/focus" element={<FocusRoom />} />
        <Route path="/garden" element={<GardenFocusRoom />} />
        <Route path="/reset-room" element={<ResetRoom />} />
        <Route path="/community" element={<Community />} />
        <Route path="/coach" element={<StudyCoach />} />
        <Route path="/insights" element={<Insights />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App