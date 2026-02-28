export default function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-[var(--color-border)] rounded-xl bg-white/50">
      {Icon && <Icon className="w-12 h-12 text-[var(--color-muted)] mb-4 opacity-50" />}
      <h3 className="text-xl font-dm-serif text-[var(--color-primary)] mb-2">
        {title}
      </h3>
      <p className="text-[var(--color-muted)] font-plus-jakarta text-sm max-w-[300px]">
        {message}
      </p>
    </div>
  );
}
