import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="error-screen">
      <div>
        <h1>Essa página não foi encontrada.</h1>
        <p>Confira o endereço ou volte para o início.</p>
        <Link className="button" href="/">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
