"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-screen">
      <div>
        <h1>Não foi possível abrir esta página.</h1>
        <p>
          Você pode tentar novamente. Seus dados salvos permanecem no sistema.
        </p>
        <button className="button" onClick={reset}>
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
