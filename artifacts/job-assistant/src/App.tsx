import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect, Link } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import Analyze from "./pages/analyze";
import Analyses from "./pages/analyses";
import AnalysisDetail from "./pages/analysis-detail";
import NotFound from "@/pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const queryClient = new QueryClient();

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="size-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">J</div>
          AI Job Assistant
        </Link>
        <Show when="signed-in">
          <nav className="flex items-center gap-6 text-sm font-medium ml-6">
            <Link href="/dashboard" className="text-foreground/60 transition-colors hover:text-foreground">Dashboard</Link>
            <Link href="/analyze" className="text-foreground/60 transition-colors hover:text-foreground">New Analysis</Link>
            <Link href="/analyses" className="text-foreground/60 transition-colors hover:text-foreground">History</Link>
          </nav>
        </Show>
        <div className="ml-auto flex items-center space-x-4">
          <Show when="signed-in">
            <span className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut(() => setLocation("/"))}>Sign out</Button>
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in" className="text-sm font-medium hover:underline">Log in</Link>
            <Button size="sm" asChild><Link href="/sign-up">Sign up</Link></Button>
          </Show>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/">
              <Layout>
                <Switch>
                  <Route path="/" component={HomeRedirect} />
                  <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
                  <Route path="/analyze"><ProtectedRoute component={Analyze} /></Route>
                  <Route path="/analyses"><ProtectedRoute component={Analyses} /></Route>
                  <Route path="/analyses/:id"><ProtectedRoute component={AnalysisDetail} /></Route>
                  <Route component={NotFound} />
                </Switch>
              </Layout>
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
