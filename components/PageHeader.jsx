export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-dm-serif text-[var(--color-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[var(--color-muted)] font-plus-jakarta mt-1 text-sm">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
