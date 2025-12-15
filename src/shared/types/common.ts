// src/shared/types/common.ts

/**
 * Common prop types used across components
 */

/** Props for components that require a route name */
export interface RouteNameProps {
  routeName: string;
}

/** Props for components that handle loading states */
export interface LoadingStateProps {
  loading?: boolean;
  error?: string | null;
}

/** Props for components with optional children */
export interface WithChildren {
  children?: React.ReactNode;
}

/** Props for components with an optional className */
export interface WithClassName {
  className?: string;
}
