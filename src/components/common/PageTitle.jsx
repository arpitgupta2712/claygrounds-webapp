/**
 * PageTitle component for consistent page headers
 */
function PageTitle({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      )}
    </div>
  );
}

export default PageTitle; 