import { Link } from "@tanstack/react-router";
import { MoreVertical, MonitorPlay, Gamepad2, Settings2, BarChart3, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandMark, InstagramIcon } from "./Brand";
import { useQuiz } from "@/quiz/store";

export function SiteHeader() {
  const insta = useQuiz((s) => s.settings.instagram);
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/">
          <BrandMark />
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }}>
              <Radio /> Live
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/stats" activeProps={{ className: "text-primary" }}>
              <BarChart3 /> Stats
            </Link>
          </Button>
          <Button variant="hero" size="sm" asChild className="ml-1">
            <Link to="/present">
              <MonitorPlay /> Present
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More options">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/operator">
                  <Gamepad2 /> Operator desk
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin">
                  <Settings2 /> Admin controls
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href={insta} target="_blank" rel="noreferrer">
                  <InstagramIcon /> Follow on Instagram
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
