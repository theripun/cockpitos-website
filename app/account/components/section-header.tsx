import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export function SectionHeader({ title, subtitle, className }: SectionHeaderProps) {
  return (
    <header className={cn("space-y-1", className)}>
      <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
      {subtitle ? (
        <p className="text-[15px] leading-snug text-zinc-500">{subtitle}</p>
      ) : null}
    </header>
  );
}
