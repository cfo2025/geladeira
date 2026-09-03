import { BrandMark } from "@/components/shell/brand-mark";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--gold) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <BrandMark tone="dark" />
        <div className="relative space-y-4">
          <p className="font-heading text-3xl leading-tight font-semibold text-balance">
            Ajude a manter nossas geladeiras organizadas.
          </p>
          <p className="max-w-sm text-sm text-sidebar-foreground/60">
            Registre o que você colocou nas geladeiras e o que retirou, para sabermos sempre
            o que tem e de quem é.
          </p>
        </div>
        <p className="relative text-xs text-sidebar-foreground/40">
          &copy; {new Date().getFullYear()} CFO Tucum XVII &middot; Geladeira Solidária
        </p>
      </div>
      <div className="flex items-center justify-center bg-muted/20 p-6">{children}</div>
    </div>
  );
}
