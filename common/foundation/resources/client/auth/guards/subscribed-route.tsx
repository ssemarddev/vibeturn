import {auth, useAuth} from '../use-auth';
import {ReactElement} from 'react';
import {Navigate, Outlet, replace} from 'react-router';

interface GuestRouteProps {
  children: ReactElement;
}
export function SubscribedRoute({children}: GuestRouteProps) {
  const {isSubscribed} = useAuth();

  if (!isSubscribed) {
    return <Navigate to="/pricing" replace />;
  }

  return children || <Outlet />;
}

export function subscribedGuard() {
  if (!auth.isSubscribed) {
    return replace('/pricing');
  }

  return null;
}
