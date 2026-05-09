import { Settings } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const icon = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="flex items-center gap-2 font-semibold text-foreground">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-elevated">
        <Settings className={`${icon} text-primary-foreground`} />
      </div>
      <span className={`${text} tracking-tight`}>Infosab OS</span>
    </div>
  );
}
