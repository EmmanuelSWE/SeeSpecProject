export function AccessPanel({ title, message }: { title: string; message: string }) {
  return (
    <section className="page-section">
      <div className="card access-panel">
        <div className="card-header">
          <h3>{title}</h3>
        </div>
        <div className="card-body">
          <p>{message}</p>
        </div>
      </div>
    </section>
  );
}
