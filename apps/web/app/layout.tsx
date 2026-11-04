import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "EWS AfterSales — O próximo capítulo de cada máquina",
    template: "%s | EWS AfterSales",
  },
  description:
    "Conecte equipamentos, clientes e sua equipe de pós-venda. Portal por QR Code, peças e assistência em um só lugar.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#main">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
