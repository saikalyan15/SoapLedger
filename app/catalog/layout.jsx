export const metadata = {
  title: 'Soap Catalogue — Healing Soil',
};

export default function CatalogLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
