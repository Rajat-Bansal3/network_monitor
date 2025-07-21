import { Link, useLocation } from "react-router-dom";
import { ModeToggle } from "./mode-toggle";
import { useAuth } from "../providers/auth-provider";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Scan", path: "/scan" },
  { name: "Add Device", path: "/add-device" },
  { name: "Device Info", path: "/app-info" },
];

const Header = () => {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className='w-full px-6 py-4 border-b bg-background sticky top-0 z-50 shadow-sm'>
      <div className='max-w-7xl mx-auto flex items-center justify-between'>
        <Link
          to='/'
          className='text-xl font-semibold text-primary hover:opacity-80 transition'
        >
          network<span className='text-muted-foreground'>Scanner</span>
        </Link>

        <nav className='flex items-center gap-4'>
          {isAuthenticated ? (
            <>
              {navItems.map(({ name, path }) => (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "text-sm font-medium transition hover:text-primary",
                    pathname === path
                      ? "text-primary underline"
                      : "text-muted-foreground"
                  )}
                >
                  {name}
                </Link>
              ))}
              <Button
                variant='ghost'
                onClick={() => {
                  document.cookie = "token=; Max-Age=0; path=/";
                  location.reload();
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <div className='dark:text-white flex flex-row gap-4'>
              <Link to='/login'>
                <Button variant='outline'>Login</Button>
              </Link>
              <Link to='/register'>
                <Button>Register</Button>
              </Link>
            </div>
          )}
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
};

export default Header;
