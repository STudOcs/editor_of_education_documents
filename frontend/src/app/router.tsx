import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthPage from '../pages/auth/AuthPage';
import Dashboard from '../pages/dashboard/Dashboard';
import DocumentCreate from '../pages/document-create/DocumentCreate';
import DocumentEditor from '../pages/document-editor/DocumentEditor';
import ProfilePage from '../pages/profile/ProfilePage';

export const router = createBrowserRouter([
  {
    path: '/',
    // Если есть токен — в дашборд, если нет — на логин
    element: localStorage.getItem('token') ? <Navigate to="/dashboard" /> : <Navigate to="/login" />,
  },
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
   {
     path: '/create',
     element: <DocumentCreate />,
   },
   {
     path: '/editor/:id',
     element: <DocumentEditor />,
   },
   {
      path: '/profile',
      element: <ProfilePage />,
    },
]);