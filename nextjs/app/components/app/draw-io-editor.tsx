"use client";

export function DrawIoEditor({ title }: { title: string }) {
    return (
        <div className="drawio-editor-shell" aria-label={title}>
            <iframe
                src="https://embed.diagrams.net/?embed=1&proto=json&spin=1"
                title={title}
                className="drawio-editor-frame"
            />
        </div>
    );
}
