import { Nav, Footer, Pricing, Faq } from "@/components/marketing";
export default function Prices() {
  return (
    <>
      <Nav />
      <main id="main" className="container section">
        <div className="section-heading centered">
          <span className="eyebrow">PLANOS E CONTRATAÇÃO</span>
          <h1>
            Uma conexão que
            <br />
            acompanha sua operação.
          </h1>
          <p>
            Escolha seu plano e confira implantação e mensalidade antes de
            contratar.
          </p>
        </div>
        <Pricing />
        <div className="section">
          <h2>Antes de escolher</h2>
          <Faq />
        </div>
      </main>
      <Footer />
    </>
  );
}
