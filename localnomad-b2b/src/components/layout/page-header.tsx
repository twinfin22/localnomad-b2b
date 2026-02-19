interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <div className="flex items-start justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
