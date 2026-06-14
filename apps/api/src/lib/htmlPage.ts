const PAGE_STYLE = `
  body { font-family: -apple-system, system-ui, sans-serif; line-height: 1.6;
         max-width: 720px; margin: 0 auto; padding: 32px 20px 80px;
         background: #0E1217; color: #E8ECF1; }
  h1 { color: #E4C9A8; }
  h2 { color: #C9A584; margin-top: 2em; }
  a { color: #C9A584; }
  th, td { text-align: left; padding: 6px 12px; border-bottom: 1px solid #252B36; }
  table { width: 100%; margin: 1em 0; }
`;

export function page(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Aparté</title>
  <style>${PAGE_STYLE}</style>
</head>
<body>
${body}
</body>
</html>`;
}
