export function PlaceholderPage({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="page-section">
      <div className="card access-panel">
        <div className="card-header">
          <h3>{title}</h3>
        </div>
        <div className="card-body">
          <p>{description}</p>
        </div>
      </div>
    </section>
  );
}
