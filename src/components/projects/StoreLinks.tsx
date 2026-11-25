/** The product, where it can be installed. */
export function StoreLinks({ stores }: { stores: { apple: string; google: string } }) {
  return (
    <>
      <a href={stores.apple} target="_blank" rel="noopener noreferrer" className="btn-raised btn-ghost">
        App Store <span aria-hidden="true">↗</span>
      </a>
      <a href={stores.google} target="_blank" rel="noopener noreferrer" className="btn-raised btn-ghost">
        Google Play <span aria-hidden="true">↗</span>
      </a>
    </>
  );
}
