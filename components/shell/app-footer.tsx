export function AppFooter() {
  return (
    <footer className="border-t px-4 py-6 md:px-8">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <p>&copy; {new Date().getFullYear()} CFO Tucum XVII &middot; Loja Honesta</p>
        <p>Sistema interno &middot; uso restrito à turma</p>
      </div>
    </footer>
  );
}
