import { test, expect } from "@playwright/test";
for (const width of [360, 390, 768, 1024, 1440]) {
  test(`landing and pricing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Sua máquina",
    );
    await expect(
      page.getByRole("link", { name: "Escolher Growth" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    if (width <= 640) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await expect(
        page.getByRole("link", { name: "Entrar", exact: true }),
      ).toBeVisible();
    }
    await page.goto("/precos");
    await expect(
      page.getByRole("link", { name: "Escolher Start" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  });
}
test("isolated demo: request, quote, acceptance and confirmed sale", async ({
  page,
}) => {
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Solicitar peça", exact: true })
    .click();
  await page
    .getByLabel("Nome do solicitante fictício")
    .fill("Cliente de teste");
  await page.getByLabel("Quantidade", { exact: true }).fill("2");
  await page
    .getByRole("button", { name: "Enviar solicitação demonstrativa" })
    .click();
  await page
    .getByRole("button", { name: "Painel do fabricante", exact: true })
    .click();
  await page.getByLabel("Valor total da proposta (R$)").fill("250");
  await page.getByRole("button", { name: "Enviar cotação de exemplo" }).click();
  await page
    .getByRole("button", { name: "Portal do cliente", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aceitar proposta de exemplo" })
    .click();
  await page
    .getByRole("button", { name: "Painel do fabricante", exact: true })
    .click();
  await expect(page.getByText("R$ 0,00", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Registrar venda confirmada" })
    .click();
  await expect(
    page.getByText("Venda confirmada", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Painel do fabricante", exact: true })
    .click();
  await expect(
    page.getByText("Venda confirmada", { exact: true }),
  ).toBeVisible();
});
test("unpaid visitor cannot open manufacturer or EWS area", async ({
  page,
}) => {
  await page.goto("/app/assinatura");
  await expect(page).toHaveURL(/\/entrar$/);
  await page.goto("/ews-admin");
  await expect(page).toHaveURL(/\/entrar$/);
});
test("pricing selection persists into signup; terms required", async ({
  page,
}) => {
  await page.goto("/precos");
  await page.getByRole("link", { name: "Escolher Industry" }).click();
  await expect(page).toHaveURL(/plano=industry/);
  await expect(page.getByText("Plano Industry", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
});
